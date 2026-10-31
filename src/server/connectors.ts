import { createHmac } from "node:crypto";
import { XMLParser } from "fast-xml-parser";
import { z } from "zod";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { readState, mutate, audit, sessionSecret } from "./store";
import { analyze } from "./ai";
import { insertItem, maskPII, safePublicUrl } from "./domain";
import type { Source, Workspace } from "./types";
export const incomingSchema = z.object({
  text: z.string().min(5).max(10000),
  url: z.string().max(2000).default(""),
  publishedAt: z.string().datetime(),
  authorId: z.string().max(200).optional(),
});
export type Incoming = z.infer<typeof incomingSchema>;
function publicIP(address: string) {
  if (address.includes(":"))
    return (
      !/^(::|fc|fd|fe80|ff|2001:db8)/i.test(address) &&
      !address.includes("ffff:")
    );
  const [a, b] = address.split(".").map(Number);
  return !(
    a === 0 ||
    a === 10 ||
    a === 127 ||
    a >= 224 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 100 && b >= 64 && b <= 127)
  );
}
export async function validateEndpoint(value: string) {
  const url = new URL(value);
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    (url.port && url.port !== "443")
  )
    throw new Error("Источник должен использовать публичный HTTPS URL");
  const host = url.hostname.replace(/^\[|\]$/g, "");
  const ips = isIP(host)
    ? [{ address: host }]
    : await lookup(host, { all: true });
  if (!ips.length || ips.some((i) => !publicIP(i.address)))
    throw new Error("Внутренние адреса недопустимы");
  return url;
}
export const connectors: Record<"JSON" | "RSS", (raw: string) => Incoming[]> = {
  JSON: (raw) => z.array(incomingSchema).max(200).parse(JSON.parse(raw)),
  RSS: (raw) => {
    const data = new XMLParser({ ignoreAttributes: false }).parse(raw);
    const entries = data.rss?.channel?.item || data.feed?.entry || [];
    return (Array.isArray(entries) ? entries : [entries])
      .slice(0, 200)
      .map((e) =>
        incomingSchema.parse({
          text: String(e.description || e.summary || e.title || "").replace(
            /<[^>]*>/g,
            " ",
          ),
          url: typeof e.link === "string" ? e.link : e.link?.["@_href"] || "",
          publishedAt: new Date(
            e.pubDate || e.published || e.updated,
          ).toISOString(),
          authorId: e.author ? String(e.author) : undefined,
        }),
      );
  },
};
export async function ingest(
  workspace: Workspace,
  sourceId: string,
  rows: Incoming[],
  actor: string,
  privateMessage = false,
  collection = false,
) {
  const results: (Incoming & Awaited<ReturnType<typeof analyze>>)[] = [];
  for (const row of rows) {
    const text = maskPII(row.text, privateMessage);
    const r = await analyze(text, workspace);
    results.push({
      ...row,
      authorId: row.authorId
        ? createHmac("sha256", sessionSecret())
            .update(row.authorId)
            .digest("hex")
        : undefined,
      text,
      ...r,
    });
  }
  return mutate(workspace, (state) => {
    let inserted = 0;
    for (const r of results) {
      if (
        insertItem(
          state,
          { ...r, sourceId, private: privateMessage },
          r.analysis,
          r.latencyMs,
          r.engine,
        )
      )
        inserted++;
    }
    const source = state.sources.find((s) => s.id === sourceId);
    if (source) {
      source.fetched += rows.length;
      source.inserted += inserted;
      source.duplicates += rows.length - inserted;
      if (collection) {
        source.lastSync = new Date().toISOString();
        source.nextSync = new Date(
          Date.now() + source.intervalMinutes * 60000,
        ).toISOString();
        source.error = undefined;
      }
    }
    audit(
      state,
      actor,
      `${collection ? "Сбор" : "Импорт"}: ${inserted} новых, ${rows.length - inserted} дубликатов / спам`,
      sourceId,
    );
    return { inserted, duplicates: rows.length - inserted };
  });
}
export async function syncSource(source: Source, actor: string) {
  if (
    !source.enabled ||
    !source.permission ||
    !source.url ||
    source.type === "Direct"
  )
    throw new Error(
      "Источник не подключён или разрешение на сбор не подтверждено",
    );
  try {
    const url = await validateEndpoint(source.url);
    const response = await fetch(url, {
      redirect: "error",
      signal: AbortSignal.timeout(15000),
      headers: {
        Accept: "application/json, application/rss+xml, application/xml",
        "User-Agent": "CityCom/0.1 PublicFeedbackCollector",
      },
    });
    if (!response.ok)
      throw new Error(`Источник вернул HTTP ${response.status}`);
    const length = Number(response.headers.get("content-length") || 0);
    if (length > 2000000) throw new Error("Ответ источника превышает 2 МБ");
    let raw = "";
    const reader = response.body?.getReader();
    if (!reader) throw new Error("Пустой ответ");
    let size = 0;
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 2000000) {
        await reader.cancel();
        throw new Error("Ответ источника превышает 2 МБ");
      }
      raw += decoder.decode(value, { stream: true });
    }
    const rows = connectors[source.type](raw).map((r) => ({
      ...r,
      url: safePublicUrl(r.url),
    }));
    return await ingest(
      "live",
      source.id,
      rows.slice(0, 30),
      actor,
      false,
      true,
    );
  } catch (e) {
    mutate("live", (s) => {
      const row = s.sources.find((x) => x.id === source.id);
      if (row) {
        row.error = e instanceof Error ? e.message : "Ошибка сбора";
        row.nextSync = new Date(Date.now() + 3600000).toISOString();
      }
      audit(s, actor, "Ошибка синхронизации", source.id);
    });
    throw e;
  }
}
export async function syncDue() {
  const state = readState("live");
  for (const source of state.sources) {
    if (
      source.enabled &&
      source.permission &&
      source.url &&
      source.type !== "Direct" &&
      (!source.nextSync || Date.parse(source.nextSync) <= Date.now())
    ) {
      try {
        await syncSource(source, "Планировщик");
      } catch {
        /* Error is persisted by connector. */
      }
    }
  }
}
