import { createHash, randomUUID } from "node:crypto";
import { z } from "zod";
import {
  departments,
  type Analysis,
  type State,
  type Item,
  type User,
} from "./types";
export const analysisSchema = z.object({
  department: z.enum(departments),
  sentiment: z.enum(["negative", "neutral", "positive"]),
  confidence: z.number().min(0).max(1),
  sentimentConfidence: z.number().min(0).max(1),
  sentimentScore: z.number().min(-1).max(1),
  language: z.enum(["ru", "kk"]),
  topic: z.string().min(1).max(160),
  district: z.string().max(100),
  location: z.string().max(200),
  reason: z.string().min(1).max(500),
  sentimentReason: z.string().min(1).max(500),
  severity: z.number().min(0).max(1),
  requestType: z.string().max(80),
});
export function maskPII(text: string, privateMessage = false) {
  let out = text
    .replace(/<[^>]*>/g, " ")
    .replace(/\b\d{12}\b/g, "[ИИН скрыт]")
    .replace(
      /(?:\+?7|8)[\s(-]*\d{3}[\s)-]*\d{3}[\s-]*\d{2}[\s-]*\d{2}/g,
      "[телефон скрыт]",
    )
    .replace(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/gi, "[email скрыт]")
    .replace(
      /(?:меня зовут|мо[её] имя|ФИО|аты-жөнім)\s*[:—-]?\s*[А-ЯЁӘІҢҒҮҰҚӨҺ][а-яёәіңғүұқөһ]+(?:\s+[А-ЯЁӘІҢҒҮҰҚӨҺ][а-яёәіңғүұқөһ]+){0,2}/gi,
      "[ФИО скрыто]",
    );
  if (privateMessage)
    out = out.replace(
      /(?:ул(?:ица)?\.?|проспект|пр-т|көшесі|адрес)\s*[:.]?\s*[А-Яа-яЁёӘәІіҢңҒғҮүҰұҚқӨөҺһ\w\s.-]{1,70}?(?:\d+[а-я]?)(?:[,\s]+(?:кв\.?|квартира)\s*\d+)?/gi,
      "[адрес скрыт]",
    );
  return out.replace(/\s+/g, " ").trim();
}
export function fingerprint(text: string) {
  return createHash("sha256")
    .update(text.toLowerCase().replace(/[^\p{L}\p{N}]/gu, ""))
    .digest("hex");
}
const rules: [string, RegExp, string][] = [
  [
    "ЖКХ",
    /отоплен|тепл[ао]|вод[аыу]|водоснаб|лифт|мусор|жылу|су жоқ|батаре/iu,
    "Перебои с коммунальными услугами",
  ],
  [
    "Дороги и транспорт",
    /ям[аы]|дорог|автобус|светофор|транспорт|жол|аялдама/iu,
    "Дороги и общественный транспорт",
  ],
  [
    "Благоустройство",
    /освещ|фонар|двор|площадк|озелен|снег|жарық|аул|қар/iu,
    "Состояние городской среды",
  ],
  [
    "Образование",
    /школ|детск.*сад|обучен|мектеп|балабақша/iu,
    "Доступность и качество образования",
  ],
  [
    "Здравоохранение",
    /поликлиник|врач|лекарств|скор[а-я]* помощ|емхана|дәрігер/iu,
    "Медицинская помощь",
  ],
  [
    "Экология",
    /дым|выброс|воздух|свалк|эколог|түтін|ауа/iu,
    "Качество окружающей среды",
  ],
  [
    "Безопасность и порядок",
    /собак|животн|безопас|поряд|иттер/iu,
    "Безопасность в городе",
  ],
  [
    "Социальная защита",
    /пособи|льгот|жиль[ея]|жәрдемақы/iu,
    "Социальная поддержка",
  ],
  [
    "Культура",
    /музе|библиотек|культур|мероприяти|кітапхана/iu,
    "Культурная жизнь",
  ],
  [
    "Предпринимательство",
    /предприним|аренд|рынок|разрешени|кәсіп/iu,
    "Условия предпринимательства",
  ],
];
export function demoAnalyze(text: string): Analysis {
  const rule = rules.find((r) => r[1].test(text));
  const positive = /спасибо|благодар|рахмет|керемет|отличн/iu.test(text);
  const negative =
    /нет |не работает|не ходит|холод|опас|яма|ямы|дым|ужас|проблем|жоқ|суық|сынған|очеред|не убирают/iu.test(
      text,
    );
  const sentiment = positive ? "positive" : negative ? "negative" : "neutral";
  const location =
    text.match(
      /(?:ул(?:ица)?\.?|проспект|пр-т|көшесі)\s+[А-Яа-яЁёӘәІіҢңҒғҮүҰұҚқӨөҺһ-]+(?:\s*,?\s*\d+[а-я]?)?/iu,
    )?.[0] || "";
  const district =
    [
      "Центральный",
      "Северный",
      "Южный",
      "Восточный",
      "Промышленный",
      "Усольский",
    ].find((d) => text.toLowerCase().includes(d.toLowerCase())) ||
    "Не определён";
  return {
    department: rule?.[0] || "Другое",
    sentiment,
    confidence: rule ? 0.86 : 0.42,
    sentimentConfidence: positive || negative ? 0.88 : 0.64,
    sentimentScore: positive ? 0.75 : negative ? -0.78 : 0,
    language: /[әіңғүұқөһ]/iu.test(text) ? "kk" : "ru",
    topic: rule?.[2] || "Требуется уточнение темы",
    district,
    location,
    reason: rule
      ? `Обнаружены тематические признаки сферы «${rule[0]}». Результат требует подтверждения сотрудником.`
      : "Недостаточно контекста: требуется ручная классификация.",
    sentimentReason: positive
      ? "Выражена благодарность."
      : negative
        ? "Описано недовольство или отсутствие услуги."
        : "Явная эмоциональная окраска не обнаружена.",
    severity:
      /авари|угроз|нет отоплен|нет воды|жылу жоқ|опас|дети мерзнут/iu.test(text)
        ? 1
        : negative
          ? 0.5
          : 0.1,
    requestType: positive
      ? "Благодарность"
      : negative
        ? "Жалоба"
        : text.includes("?")
          ? "Вопрос"
          : "Предложение",
  };
}
export { priority } from "@/entities/issue";
export { filterItems } from "@/features/filter-feedback";
export function insertItem(
  state: State,
  input: {
    text: string;
    sourceId: string;
    url: string;
    publishedAt: string;
    publishedAtPrecision?: "day" | "second";
    reactions?: number;
    replies?: number;
    views?: number;
    authorId?: string;
    private?: boolean;
  },
  analysis: Analysis,
  latencyMs: number,
  engine: string,
) {
  const text = maskPII(input.text, !!input.private);
  const fp = fingerprint(text);
  if (
    state.items.some((i) => i.fingerprint === fp) ||
    (/купить|скидка|заработок/iu.test(text) && /https?:/i.test(text))
  )
    return null;
  // A location and exact topic are required; unknown locations never merge automatically.
  const location = analysis.location
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]/gu, "");
  let cluster = location
    ? state.clusters.find(
        (c) =>
          c.department === analysis.department &&
          c.title === analysis.topic &&
          c.location.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "") ===
            location &&
          Date.now() - new Date(c.createdAt).getTime() < 30 * 86400000 &&
          !["Решено", "Закрыто"].includes(c.status),
      )
    : undefined;
  if (!cluster) {
    cluster = {
      id: randomUUID(),
      title: analysis.topic,
      location: analysis.location,
      district: analysis.district,
      department: analysis.department,
      status: "Новое",
      createdAt: input.publishedAt,
      assignee: "",
      summary: `${analysis.topic}. ${analysis.reason}`,
    };
    state.clusters.push(cluster);
  }
  if (Date.parse(input.publishedAt) < Date.parse(cluster.createdAt))
    cluster.createdAt = input.publishedAt;
  const item: Item = {
    ...analysis,
    id: randomUUID(),
    text,
    sourceId: input.sourceId,
    url: input.private ? "" : safePublicUrl(input.url),
    publishedAt: input.publishedAt,
    publishedAtPrecision: input.publishedAtPrecision,
    reactions: input.reactions,
    replies: input.replies,
    views: input.views,
    ingestedAt: new Date().toISOString(),
    authorHash: input.authorId
      ? createHash("sha256")
          .update(
            (process.env.CITYCOM_AUTHOR_SALT || "citycom-demo") +
              input.authorId,
          )
          .digest("hex")
          .slice(0, 20)
      : "unknown",
    private: !!input.private,
    clusterId: cluster.id,
    reviewed: false,
    latencyMs,
    engine,
    fingerprint: fp,
  };
  if (item.private) {
    item.location = "";
  }
  state.items.push(item);
  return item;
}
export function safePublicUrl(value: string) {
  try {
    const u = new URL(value);
    if (!["http:", "https:"].includes(u.protocol)) return "";
    u.username = "";
    u.password = "";
    for (const key of [...u.searchParams.keys()]) {
      if (
        ![
          "id",
          "page",
          "p",
          "post",
          "topic",
          "thread",
          "appeal",
          "question",
          "reply",
        ].includes(key) ||
        !/^[a-z0-9_-]{1,100}$/i.test(u.searchParams.get(key) || "")
      )
        u.searchParams.delete(key);
    }
    u.hash = "";
    return u.toString();
  } catch {
    return "";
  }
}
export function scope(state: State, user: User): State {
  const items = state.items
    .filter(
      (i) => user.role !== "department" || i.department === user.department,
    )
    .map((i) =>
      i.private
        ? {
            ...i,
            text: "Приватное обращение · текст доступен уполномоченному оператору",
            url: "",
            location: "",
            reason: "Direct: результат обезличен",
            sentimentReason: "Direct: результат обезличен",
          }
        : i,
    );
  const ids = new Set(items.map((i) => i.clusterId));
  return {
    ...state,
    items,
    clusters: state.clusters
      .filter((c) => ids.has(c.id))
      .map((c) =>
        state.items.filter((i) => i.clusterId === c.id).every((i) => i.private)
          ? {
              ...c,
              location: "",
              summary: "Приватные обращения · доступны только агрегаты",
            }
          : c,
      ),
    sources: state.sources.map((s) => ({
      ...s,
      cursor: undefined,
      url: user.role === "admin" ? s.url : "",
      error: s.error
        ? "Ошибка сбора. Проверьте разрешение, доступность источника и журнал сервера."
        : undefined,
    })),
    audit: user.role === "admin" ? state.audit : [],
    quality: state.quality,
  };
}
