import { createHmac } from "node:crypto";
import { XMLParser } from "fast-xml-parser";
import { z } from "zod";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import {
  readState,
  mutate,
  audit,
  sessionSecret,
  protectDirect,
  purgeExpiredDirect,
} from "./store";
import { analyze } from "./ai";
import { insertItem, maskPII, safePublicUrl, fingerprint } from "./domain";
import type { Source, Workspace } from "./types";
export { incomingSchema } from "./source-contract";
import {
  incomingSchema,
  matchesKeywords,
  type Incoming,
} from "./source-contract";
import { parsePublicHtml, dialogDetailLinks } from "./public-html";
import {
  collectSocial,
  publicApiTypes,
  sourceTokenName,
} from "./social-sources";
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
export const connectors: Record<
  "JSON" | "RSS" | "HTML",
  (raw: string) => Incoming[]
> = {
  HTML: (raw) => {
    // Only structured resident submissions; never infer missing publication dates.
    const rows: Incoming[] = [];
    function visit(value: unknown) {
      if (Array.isArray(value)) {
        value.forEach(visit);
        return;
      }
      if (!value || typeof value !== "object") return;
      const node = value as Record<string, unknown>;
      if (
        ["Comment", "DiscussionForumPosting"].includes(String(node["@type"]))
      ) {
        const parsed = incomingSchema.safeParse({
          text: String(node.text || node.articleBody || "").replace(
            /<[^>]*>/g,
            " ",
          ),
          url: typeof node.url === "string" ? node.url : "",
          publishedAt: node.datePublished,
        });
        if (parsed.success) rows.push(parsed.data);
      }
      Object.values(node).forEach(visit);
    }
    for (const match of raw.matchAll(
      /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
    )) {
      try {
        visit(JSON.parse(match[1]));
      } catch {
        /* Ignore unrelated malformed metadata. */
      }
    }
    if (!rows.length)
      throw new Error(
        "HTML не содержит Comment/DiscussionForumPosting JSON-LD с текстом и ISO датой. Используйте разрешённый RSS/JSON или выгрузку.",
      );
    return rows.slice(0, 200);
  },
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
  const seen = new Set(
    readState(workspace).items.map((item) => item.fingerprint),
  );
  for (const row of rows) {
    const text = maskPII(row.text, privateMessage);
    const fp = fingerprint(text);
    if (seen.has(fp)) continue;
    seen.add(fp);
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
const active = new Set<string>();
export async function syncSource(source: Source, actor: string) {
  if (active.has(source.id))
    throw new Error("Сбор этого источника уже выполняется");
  active.add(source.id);
  try {
    return await collectSource(source, actor);
  } finally {
    active.delete(source.id);
  }
}
export async function collectSourceRows(
  source: Source,
): Promise<{ rows: Incoming[]; cursor?: number }> {
  if (source.type === "Telegram") {
    const token = process.env[sourceTokenName(source.id)];
    if (
      token &&
      readState("live").sources.some(
        (other) =>
          other.id !== source.id &&
          other.type === "Telegram" &&
          process.env[sourceTokenName(other.id)] === token,
      )
    )
      throw new Error(
        "Для каждого публичного Telegram-источника нужен отдельный бот: общий polling потеряет обновления других каналов",
      );
  }
  if ((publicApiTypes as readonly string[]).includes(source.type))
    return collectSocial(source);
  if (source.type === "Direct")
    throw new Error("Для Direct используйте защищённый сбор");
  const url = await validateEndpoint(source.url);
  if (
    /(^|\.)(t\.me|telegram\.org|instagram\.com|facebook\.com|vk\.com|vk\.ru)$/.test(
      url.hostname,
    )
  )
    throw new Error(
      "Для этой площадки требуется отдельный официальный API/согласие; универсальный сбор отключён.",
    );
  const response = await fetch(url, {
    redirect: "error",
    signal: AbortSignal.timeout(15000),
    headers: {
      Accept:
        "application/json, application/rss+xml, application/xml, text/html",
      "User-Agent": "CityCom/0.1 PublicFeedbackCollector",
    },
  });
  if (!response.ok) throw new Error(`Источник вернул HTTP ${response.status}`);
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
  const details =
    source.type === "HTML" ? dialogDetailLinks(raw, source.url) : [];
  if (details.length) {
    const rows: Incoming[] = [];
    for (const link of details) {
      const result = await collectSourceRows({ ...source, url: link });
      rows.push(...result.rows);
    }
    return { rows };
  }
  const rows = (
    source.type === "HTML"
      ? parsePublicHtml(raw, source.url) || connectors.HTML(raw)
      : connectors[source.type as "JSON" | "RSS"](raw)
  ).map((r) => ({ ...r, url: safePublicUrl(r.url) }));
  return { rows };
}
async function collectSource(source: Source, actor: string) {
  if (source.type === "Direct") return syncTelegramDirect(source, actor);
  if (!source.enabled || !source.permission || !source.url)
    throw new Error(
      "Источник не подключён или разрешение на сбор не подтверждено",
    );
  try {
    const { rows, cursor } = await collectSourceRows(source);
    const matched = rows.filter((row) =>
      matchesKeywords(row.text, source.keywords),
    );
    const result = await ingest(
      "live",
      source.id,
      matched.slice(0, 30),
      actor,
      false,
      true,
    );
    mutate("live", (state) => {
      const current = state.sources.find((item) => item.id === source.id);
      if (current) {
        current.lastFetched = rows.length;
        current.lastMatched = matched.length;
        if (cursor !== undefined) current.cursor = cursor;
      }
    });
    return result;
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
  mutate("live", (state) => purgeExpiredDirect(state));
  const state = readState("live");
  for (const source of state.sources) {
    if (
      source.enabled &&
      source.permission &&
      (source.url ||
        (source.type === "Direct" && process.env.CITYCOM_TELEGRAM_BOT_TOKEN)) &&
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

export async function syncDemo(source: Source, actor: string) {
  if (!source.enabled) throw new Error("Источник приостановлен");
  const marker =
    source.id === "source-2"
      ? "Сатпаева 19"
      : source.id === "source-3"
        ? "Торайгырова 88"
        : "Лермонтова 44";
  const fixtures =
    source.type === "Direct"
      ? [
          "Меня зовут Иван Иванов. Телефон +77011234567. Нет воды в доме, прошу помочь.",
          "Аулада жарық жоқ, шамдарды жөндеуді сұраймын.",
        ]
      : [
          `На улице ${marker} нет отопления. Просим восстановить тепло.`,
          `Аулада қоқыс жиналған, тазалауды сұраймыз. ${marker}`,
        ];
  const result = await ingest(
    "demo",
    source.id,
    fixtures.map((text, index) => ({
      text,
      url:
        source.type === "Direct"
          ? ""
          : `https://example.org/demo/${source.id}/${index}`,
      publishedAt: "2026-11-01T08:00:00.000Z",
      authorId: `demo-${source.id}-${index}`,
    })),
    actor,
    source.type === "Direct",
    true,
  );
  return {
    ...result,
    message: `DEMO: сохранено ${result.inserted}, повторов ${result.duplicates}. Подготовленные данные; сетевых запросов нет.`,
  };
}

export const DIRECT_CONSENT =
  "Согласен на обработку и передачу обезличенного текста в Gemini. Обращение:";
const telegramUpdate = z.object({
  update_id: z.number().int(),
  message: z
    .object({
      message_id: z.number().int(),
      date: z.number(),
      text: z.string().max(11000).optional(),
      chat: z.object({ id: z.number(), type: z.string() }),
    })
    .optional(),
});
export function telegramRows(raw: unknown) {
  const data = z
    .object({ ok: z.literal(true), result: z.array(telegramUpdate).max(30) })
    .parse(raw);
  const rows = data.result.flatMap(({ message }) => {
    if (
      !message ||
      message.chat.type !== "private" ||
      !message.text?.startsWith(DIRECT_CONSENT)
    )
      return [];
    const parsed = incomingSchema.safeParse({
      text: message.text.slice(DIRECT_CONSENT.length).trim(),
      url: "",
      publishedAt: new Date(message.date * 1000).toISOString(),
      authorId: `telegram:${message.chat.id}`,
    });
    return parsed.success ? [parsed.data] : [];
  });
  return {
    rows,
    cursor: data.result.length
      ? Math.max(...data.result.map((u) => u.update_id)) + 1
      : undefined,
    skipped: data.result.length - rows.length,
  };
}
async function syncTelegramDirect(source: Source, actor: string) {
  if (
    !source.enabled ||
    process.env.CITYCOM_TELEGRAM_OWNER_APPROVED !== "true" ||
    !process.env.CITYCOM_TELEGRAM_BOT_TOKEN
  )
    throw new Error(
      "Подключите официальный бот владельцем: CITYCOM_TELEGRAM_BOT_TOKEN и CITYCOM_TELEGRAM_OWNER_APPROVED",
    );
  // Fail before requesting private content when encryption or AI authorization is missing.
  protectDirect("configuration-check");
  if (
    process.env.AI_TRANSFER_APPROVED !== "true" ||
    !process.env.GEMINI_API_KEY ||
    !process.env.GEMINI_MODEL
  )
    throw new Error(
      "Для Direct настройте Gemini и разрешение передачи обезличенного текста",
    );
  try {
    let response: Response;
    try {
      response = await fetch(
        `https://api.telegram.org/bot${process.env.CITYCOM_TELEGRAM_BOT_TOKEN}/getUpdates`,
        {
          method: "POST",
          redirect: "error",
          signal: AbortSignal.timeout(15000),
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            offset: source.cursor || 0,
            limit: 30,
            timeout: 0,
            allowed_updates: ["message"],
          }),
        },
      );
    } catch {
      throw new Error("Telegram Bot API недоступен");
    }
    if (!response.ok)
      throw new Error(
        `Telegram Bot API HTTP ${response.status}; проверьте токен и отсутствие webhook`,
      );
    const parsed = telegramRows(await response.json());
    const result = await ingest(
      "live",
      source.id,
      parsed.rows,
      actor,
      true,
      true,
    );
    mutate("live", (state) => {
      const current = state.sources.find((s) => s.id === source.id);
      if (current && parsed.cursor !== undefined)
        current.cursor = parsed.cursor;
      audit(
        state,
        actor,
        `Direct: пропущено без согласия/неподдерживаемых ${parsed.skipped}`,
        source.id,
      );
    });
    return result;
  } catch (error) {
    mutate("live", (state) => {
      const current = state.sources.find((s) => s.id === source.id);
      if (current) {
        current.error = "Ошибка Telegram Direct";
        current.nextSync = new Date(Date.now() + 3600000).toISOString();
      }
    });
    throw error;
  }
}
