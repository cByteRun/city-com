import { z } from "zod";
import type { Source } from "./types";
import { incomingSchema, type Incoming } from "./source-contract";
export const publicApiTypes = [
  "VK",
  "Instagram",
  "Facebook",
  "Telegram",
] as const;
export function sourceTokenName(id: string) {
  if (!/^source-[1-9]\d*$/.test(id))
    throw new Error("Некорректный ID источника");
  return `CITYCOM_${id.replace("-", "_").toUpperCase()}_TOKEN`;
}
export function validateSocialSource(
  source: Pick<Source, "type" | "url" | "resourceId">,
) {
  const u = new URL(source.url);
  if (
    u.protocol !== "https:" ||
    u.username ||
    u.password ||
    u.search ||
    u.hash ||
    u.port
  )
    throw new Error("Укажите публичную HTTPS ссылку без параметров");
  const host = u.hostname.replace(/^www\./, "");
  if (
    source.type === "VK" &&
    (host !== "vk.com" ||
      !/^\/(?:wall-?\d+_\d+|[A-Za-z][A-Za-z0-9_.]{2,99})\/?$/.test(u.pathname))
  )
    throw new Error(
      "VK: укажите ссылку на открытое сообщество или публикацию https://vk.com/wall-123_456",
    );
  if (
    source.type === "Instagram" &&
    (host !== "instagram.com" ||
      !/^\/(p|reel)\/[\w-]+\/?$/.test(u.pathname) ||
      !/^\d+$/.test(source.resourceId || ""))
  )
    throw new Error(
      "Instagram: укажите ссылку публикации и числовой Media ID из официального API",
    );
  if (
    source.type === "Facebook" &&
    (host !== "facebook.com" || !/^[\d]+_[\d]+$/.test(source.resourceId || ""))
  )
    throw new Error(
      "Facebook: укажите ссылку публикации и Post ID вида PAGE_ID_POST_ID",
    );
  if (
    source.type === "Telegram" &&
    (host !== "t.me" || !/^\/[A-Za-z][\w]{3,31}\/?$/.test(u.pathname))
  )
    throw new Error(
      "Telegram: нужна ссылка на ваш публичный канал https://t.me/channel_name",
    );
  return u;
}
async function officialJson(
  url: URL,
  token: string,
  form?: URLSearchParams,
): Promise<unknown> {
  if (
    ![
      "api.vk.com",
      "graph.instagram.com",
      "graph.facebook.com",
      "api.telegram.org",
    ].includes(url.hostname)
  )
    throw new Error("Неизвестный API");
  let response: Response;
  try {
    response = await fetch(url, {
      method: form ? "POST" : "GET",
      redirect: "error",
      signal: AbortSignal.timeout(15000),
      headers: form
        ? { "Content-Type": "application/x-www-form-urlencoded" }
        : { Authorization: `Bearer ${token}` },
      body: form,
    });
  } catch {
    throw new Error("Официальный API недоступен; проверьте соединение");
  }
  if (!response.ok)
    throw new Error(
      `API HTTP ${response.status}; проверьте права, токен и лимиты`,
    );
  const reader = response.body?.getReader();
  if (!reader) throw new Error("Пустой ответ API");
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > 2000000) {
      await reader.cancel();
      throw new Error("Ответ API больше 2 МБ");
    }
    chunks.push(value);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new Error("API вернул неверный JSON");
  }
}
const vkItem = z.object({
  id: z.number().int(),
  date: z.number().int(),
  text: z.string(),
  from_id: z.number().optional(),
  deleted: z.boolean().optional(),
  likes: z.object({ count: z.number().int().nonnegative() }).optional(),
});
export function parseVkComments(
  raw: unknown,
  owner: string,
  post: string,
): Incoming[] {
  const result = z
    .object({ response: z.object({ items: z.array(vkItem) }) })
    .safeParse(raw);
  if (!result.success)
    throw new Error(
      "VK: ошибка API или неверный ответ; проверьте токен и разрешение wall.getComments",
    );
  return result.data.response.items
    .filter((row) => !row.deleted && row.text.trim().length >= 5)
    .map((row) =>
      incomingSchema.parse({
        text: row.text,
        publishedAt: new Date(row.date * 1000).toISOString(),
        authorId: row.from_id === undefined ? undefined : `vk:${row.from_id}`,
        url: `https://vk.com/wall${owner}_${post}?reply=${row.id}`,
        reactions: row.likes?.count,
      }),
    );
}
const graphComment = z.object({
  id: z.string(),
  text: z.string().optional(),
  message: z.string().optional(),
  timestamp: z.string().optional(),
  created_time: z.string().optional(),
  like_count: z.number().int().nonnegative().optional(),
});
export function parseGraphComments(
  raw: unknown,
  sourceUrl: string,
): Incoming[] {
  const data = z.object({ data: z.array(graphComment) }).safeParse(raw);
  if (!data.success)
    throw new Error(
      "Meta: ошибка API; проверьте доступ к публикации и разрешение чтения комментариев",
    );
  return data.data.data.flatMap((row) => {
    const text = row.text || row.message || "";
    const time = row.timestamp || row.created_time;
    if (text.trim().length < 5 || !time) return [];
    return [
      incomingSchema.parse({
        text,
        publishedAt: new Date(time).toISOString(),
        url: sourceUrl,
        reactions: row.like_count,
      }),
    ];
  });
}
export const PUBLIC_TELEGRAM_CONSENT =
  "Согласен на обработку и передачу обезличенного текста в Gemini. Обращение:";
const channelPost = z.object({
  message_id: z.number().int(),
  date: z.number().int(),
  text: z.string().optional(),
  chat: z.object({
    id: z.number(),
    type: z.string(),
    username: z.string().optional(),
  }),
});
export function parseChannelUpdates(raw: unknown, channel: string) {
  const data = z
    .object({
      ok: z.literal(true),
      result: z
        .array(
          z.object({
            update_id: z.number().int(),
            channel_post: channelPost.optional(),
          }),
        )
        .max(30),
    })
    .parse(raw);
  return {
    rows: data.result.flatMap(({ channel_post: post }) => {
      if (
        !post ||
        post.chat.type !== "channel" ||
        post.chat.username?.toLowerCase() !== channel.toLowerCase() ||
        !post.text?.startsWith(PUBLIC_TELEGRAM_CONSENT)
      )
        return [];
      const parsed = incomingSchema.safeParse({
        text: post.text.slice(PUBLIC_TELEGRAM_CONSENT.length).trim(),
        publishedAt: new Date(post.date * 1000).toISOString(),
        url: `https://t.me/${channel}/${post.message_id}`,
      });
      return parsed.success ? [parsed.data] : [];
    }),
    cursor: data.result.length
      ? Math.max(...data.result.map((row) => row.update_id)) + 1
      : undefined,
  };
}
export async function collectSocial(
  source: Source,
): Promise<{ rows: Incoming[]; cursor?: number }> {
  const u = validateSocialSource(source);
  const token = process.env[sourceTokenName(source.id)];
  if (!token)
    throw new Error(
      `Укажите серверный секрет ${sourceTokenName(source.id)}; ключи не вводятся в URL`,
    );
  if (source.type === "VK") {
    const postMatch = u.pathname.match(/^\/wall(-?\d+)_(\d+)/);
    const version = process.env.CITYCOM_VK_API_VERSION;
    if (!version || !/^\d+\.\d+$/.test(version))
      throw new Error(
        "Укажите CITYCOM_VK_API_VERSION из документации вашего приложения VK",
      );
    const targets: { owner: string; post: string }[] = [];
    if (postMatch) targets.push({ owner: postMatch[1], post: postMatch[2] });
    else {
      const raw = await officialJson(
        new URL("https://api.vk.com/method/wall.get"),
        token,
        new URLSearchParams({
          domain: u.pathname.split("/")[1],
          count: "3",
          filter: "all",
          access_token: token,
          v: version,
        }),
      );
      const result = z
        .object({
          response: z.object({
            items: z.array(
              z.object({
                id: z.number().int(),
                owner_id: z.number().int(),
                marked_as_ads: z.number().optional(),
              }),
            ),
          }),
        })
        .safeParse(raw);
      if (!result.success)
        throw new Error(
          "VK: не удалось прочитать стену сообщества; проверьте токен и права wall.get",
        );
      for (const post of result.data.response.items)
        if (!post.marked_as_ads)
          targets.push({ owner: String(post.owner_id), post: String(post.id) });
    }
    const rows: Incoming[] = [];
    for (const { owner, post } of targets) {
      const raw = await officialJson(
        new URL("https://api.vk.com/method/wall.getComments"),
        token,
        new URLSearchParams({
          owner_id: owner,
          post_id: post,
          count: "30",
          sort: "desc",
          need_likes: "1",
          extended: "0",
          access_token: token,
          v: version,
        }),
      );
      rows.push(...parseVkComments(raw, owner, post));
    }
    return { rows };
  }

  if (source.type === "Instagram" || source.type === "Facebook") {
    const version = process.env.CITYCOM_GRAPH_API_VERSION;
    if (!version || !/^v\d+\.\d+$/.test(version))
      throw new Error(
        "Укажите CITYCOM_GRAPH_API_VERSION поддерживаемого приложения Meta",
      );
    const host =
      source.type === "Instagram"
        ? "graph.instagram.com"
        : "graph.facebook.com";
    const url = new URL(
      `https://${host}/${version}/${source.resourceId}/comments`,
    );
    url.searchParams.set(
      "fields",
      source.type === "Instagram"
        ? "id,text,timestamp,like_count"
        : "id,message,created_time,like_count",
    );
    url.searchParams.set("limit", "30");
    return {
      rows: parseGraphComments(await officialJson(url, token), source.url),
    };
  }
  if (source.type === "Telegram") {
    if (source.aiConsent !== true)
      throw new Error(
        "Telegram: подтвердите индивидуальное согласие авторов для указанного контекста",
      );
    if (token === process.env.CITYCOM_TELEGRAM_BOT_TOKEN)
      throw new Error(
        "Для публичного канала используйте отдельного бота, чтобы не конфликтовать с Direct polling",
      );
    const form = new URLSearchParams({
      offset: String(source.cursor || 0),
      limit: "30",
      timeout: "0",
      allowed_updates: JSON.stringify(["channel_post"]),
    });
    const raw = await officialJson(
      new URL(`https://api.telegram.org/bot${token}/getUpdates`),
      token,
      form,
    );
    return parseChannelUpdates(raw, u.pathname.split("/")[1]);
  }
  throw new Error("Неизвестный социальный адаптер");
}
