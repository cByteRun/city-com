import { z } from "zod";
import {
  requireUser,
  assertOrigin,
  errorResponse,
  canEdit,
} from "@/server/auth";
import { readState, mutate, audit } from "@/server/store";
import { scope, analysisSchema, maskPII } from "@/server/domain";
import { seed } from "@/server/seed";
import {
  ingest,
  incomingSchema,
  syncSource,
  syncDemo,
  validateEndpoint,
  collectSourceRows,
} from "@/server/connectors";
import { publicApiTypes, validateSocialSource } from "@/server/social-sources";
import { matchesKeywords } from "@/server/source-contract";
import { evaluate } from "@/server/quality";
import { departments } from "@/server/types";
export const runtime = "nodejs";
export const maxDuration = 300;
export async function POST(request: Request) {
  try {
    assertOrigin(request);
    const user = await requireUser();
    if (!canEdit(user.role)) throw new Error("FORBIDDEN");
    const raw = await request.text();
    if (raw.length > 2000000)
      throw new Error("Максимальный размер запроса 2 МБ");
    const body = JSON.parse(raw);
    const action = z
      .enum([
        "reset",
        "ingest",
        "sync",
        "cluster",
        "review",
        "private",
        "delete",
        "source",
        "probe",
        "source-create",
        "evaluate",
        "department",
      ])
      .parse(body.action);
    let result: unknown = { ok: true };
    if (action === "reset") {
      if (user.workspace !== "demo" || user.role !== "admin")
        throw new Error("FORBIDDEN");
      mutate("demo", (s) => Object.assign(s, seed(true)));
    }
    if (action === "ingest") {
      if (!["admin", "analyst"].includes(user.role))
        throw new Error("FORBIDDEN");
      const input = z
        .object({
          sourceId: z.string(),
          rows: z.array(incomingSchema).min(1).max(30),
          approved: z.literal(true),
          private: z.boolean().default(false),
        })
        .parse(body);
      const ingestionSource = readState(user.workspace).sources.find(
        (s) => s.id === input.sourceId,
      );
      if (ingestionSource?.type === "Direct" && !input.private)
        throw new Error("Direct нельзя импортировать как публичный источник");
      if (!ingestionSource) throw new Error("Источник не найден");
      if (input.private && user.workspace === "live")
        throw new Error(
          "Direct P0 доступен только в синтетическом DEMO. Подключение реального аккаунта требует отдельной интеграции.",
        );
      result = await ingest(
        user.workspace,
        input.private ? "direct" : input.sourceId,
        input.rows,
        user.name,
        input.private,
      );
    }
    if (action === "sync") {
      if (user.role !== "admin") throw new Error("FORBIDDEN");
      const source = readState(user.workspace).sources.find(
        (s) => s.id === body.id,
      );
      if (!source) throw new Error("Источник не найден");
      if (user.workspace === "demo") result = await syncDemo(source, user.name);
      else result = await syncSource(source, user.name);
    }
    if (action === "probe") {
      if (user.role !== "admin") throw new Error("FORBIDDEN");
      const source = readState(user.workspace).sources.find(
        (item) => item.id === body.id,
      );
      if (!source || source.type === "Direct")
        throw new Error("Выберите публичный источник");
      if (user.workspace !== "live")
        throw new Error("Проверка сети доступна только в LIVE");
      const { rows } = await collectSourceRows(source);
      const matched = rows.filter((row) =>
        matchesKeywords(row.text, source.keywords),
      );
      result = {
        message: `Проверка: получено ${rows.length}, по ключевым словам ${matched.length}. Gemini и запись обращений не запускались.`,
      };
      mutate(user.workspace, (state) =>
        audit(
          state,
          user.name,
          `Проверка источника: ${rows.length}, совпадений ${matched.length}`,
          source.id,
        ),
      );
    }
    if (action === "cluster") {
      const input = z
        .object({
          id: z.string(),
          department: z.enum(departments),
          status: z.enum([
            "Новое",
            "Передано",
            "В работе",
            "Решено",
            "Закрыто",
          ]),
        })
        .parse(body);
      mutate(user.workspace, (s) => {
        const c = s.clusters.find((c) => c.id === input.id);
        if (!c) throw new Error("Проблема не найдена");
        if (
          user.role === "department" &&
          (c.department !== user.department ||
            input.department !== user.department)
        )
          throw new Error("FORBIDDEN");
        const transitions: Record<string, string[]> = {
          Новое: ["Новое", "Передано"],
          Передано: ["Передано", "В работе"],
          "В работе": ["В работе", "Решено"],
          Решено: ["Решено", "В работе", "Закрыто"],
          Закрыто: ["Закрыто", "В работе"],
        };
        if (!transitions[c.status].includes(input.status))
          throw new Error(
            "Сначала передайте проблему, затем начните работу и подтвердите решение.",
          );
        c.department = input.department;
        c.status = input.status;
        c.assignee = input.status === "Новое" ? "" : input.department;
        if (input.status !== "Новое" && !c.assignedAt)
          c.assignedAt = new Date().toISOString();
        if (input.status === "Решено") c.resolvedAt = new Date().toISOString();
        if (input.status === "В работе") delete c.resolvedAt;
        s.items
          .filter((i) => i.clusterId === c.id)
          .forEach((i) => {
            i.department = input.department;
          });
        audit(
          s,
          user.name,
          `Подтверждено: ${input.department} · ${input.status}`,
          c.id,
        );
      });
    }
    if (action === "review") {
      const input = z
        .object({
          id: z.string(),
          department: z.enum(departments),
          sentiment: z.enum(["positive", "neutral", "negative"]),
          reason: z.string().min(3).max(500),
        })
        .parse(body);
      mutate(user.workspace, (s) => {
        const i = s.items.find((i) => i.id === input.id);
        if (!i) throw new Error("Обращение не найдено");
        if (user.role === "department" && i.department !== user.department)
          throw new Error("FORBIDDEN");
        if (user.role === "department" && input.department !== user.department)
          throw new Error("FORBIDDEN");
        const c = s.clusters.find((c) => c.id === i.clusterId);
        if (c && input.department !== i.department) {
          const clone = {
            ...c,
            id: crypto.randomUUID(),
            department: input.department,
            status: "Новое" as const,
            assignee: "",
            assignedAt: undefined,
            resolvedAt: undefined,
          };
          s.clusters.push(clone);
          i.clusterId = clone.id;
        }
        i.department = input.department;
        i.sentiment = input.sentiment;
        i.sentimentScore =
          input.sentiment === "positive"
            ? 0.75
            : input.sentiment === "negative"
              ? -0.75
              : 0;
        i.reviewed = true;
        i.reason = maskPII(
          `Подтверждено оператором: ${input.reason}`,
          i.private,
        );
        audit(s, user.name, "Исправление и подтверждение классификации", i.id);
      });
    }
    if (action === "private") {
      if (!["admin", "analyst"].includes(user.role))
        throw new Error("FORBIDDEN");
      result = mutate(user.workspace, (s) => {
        const i = s.items.find((i) => i.id === body.id && i.private);
        if (!i) throw new Error("Direct не найден");
        audit(s, user.name, "Доступ к обезличенному Direct", i.id);
        return { text: i.text };
      });
    }
    if (action === "delete") {
      if (user.role !== "admin") throw new Error("FORBIDDEN");
      mutate(user.workspace, (s) => {
        s.items = s.items.filter((i) => i.id !== body.id);
        s.clusters = s.clusters.filter((c) =>
          s.items.some((i) => i.clusterId === c.id),
        );
        audit(s, user.name, "Удаление записи по запросу", String(body.id));
      });
    }
    if (action === "source-create") {
      if (user.role !== "admin") throw new Error("FORBIDDEN");
      mutate(user.workspace, (state) => {
        const next =
          Math.max(
            0,
            ...state.sources.map((item) =>
              Number(item.id.match(/^source-(\d+)$/)?.[1] || 0),
            ),
          ) + 1;
        const id = `source-${next}`;
        state.sources.push({
          id,
          name: `Источник ${next}`,
          type: "HTML",
          url: "",
          enabled: false,
          permission: false,
          configured: true,
          intervalMinutes: 60,
          fetched: 0,
          inserted: 0,
          duplicates: 0,
        });
        audit(state, user.name, "Добавлен источник", id);
      });
    }
    if (action === "source") {
      if (user.role !== "admin") throw new Error("FORBIDDEN");
      const input = z
        .object({
          id: z.string(),
          enabled: z.boolean(),
          intervalMinutes: z.number().int().min(1).max(60),
          name: z.string().min(3).max(120).optional(),
          type: z.enum(["JSON", "RSS", "HTML", ...publicApiTypes]).optional(),
          url: z.string().max(2000).optional(),
          keywords: z.string().max(500).optional(),
          permission: z.boolean().optional(),
          permissionBasis: z.string().max(1000).optional(),
          resourceId: z.string().max(200).optional(),
          city: z.string().max(100).optional(),
          region: z.string().max(100).optional(),
          tags: z.string().max(500).optional(),
          aiConsent: z.boolean().optional(),
        })
        .parse(body);
      if (
        input.type &&
        (publicApiTypes as readonly string[]).includes(input.type)
      )
        validateSocialSource({
          type: input.type,
          url: input.url || "",
          resourceId: input.resourceId,
        });
      if (input.url) {
        const endpoint = await validateEndpoint(input.url);
        if (endpoint.search || endpoint.hash)
          throw new Error("URL не должен содержать токены, query или fragment");
      }
      if (input.permission && !input.permissionBasis?.trim())
        throw new Error("Укажите основание разрешения и условия использования");
      mutate(user.workspace, (s) => {
        const source = s.sources.find((s) => s.id === input.id);
        if (!source) throw new Error("Источник не найден");
        if (source.type === "Direct" && input.type)
          throw new Error("Direct нельзя преобразовать в публичный источник");
        if (input.name !== undefined) {
          Object.assign(source, input, {
            configured: true,
            cursor: undefined,
            lastSync: undefined,
            nextSync: undefined,
            error: undefined,
          });
        }
        Object.assign(source, {
          enabled: input.enabled,
          intervalMinutes: input.intervalMinutes,
        });
        audit(s, user.name, "Изменено расписание источника", source.id);
      });
    }
    if (action === "department") {
      if (user.role !== "admin") throw new Error("FORBIDDEN");
      const input = z
        .object({
          id: z.string(),
          topics: z.string().min(3).max(1000),
          responsible: z.string().max(120),
        })
        .parse(body);
      mutate(user.workspace, (s) => {
        const d = s.directory.find((d) => d.id === input.id);
        if (!d) throw new Error("Подразделение не найдено");
        d.topics = input.topics;
        d.responsible = input.responsible;
        audit(
          s,
          user.name,
          "Обновлены темы и ответственный подразделения",
          d.name,
        );
      });
    }
    if (action === "evaluate") {
      if (user.role !== "admin" && user.role !== "analyst")
        throw new Error("FORBIDDEN");
      const quality = await evaluate(user.workspace);
      mutate(user.workspace, (s) => {
        s.quality = quality;
        audit(
          s,
          user.name,
          "Запущена оценка на размеченной smoke-выборке",
          String(quality.samples),
        );
      });
      result = quality;
    }
    return Response.json({
      result,
      state: scope(readState(user.workspace), user),
    });
  } catch (e) {
    return errorResponse(e);
  }
}
