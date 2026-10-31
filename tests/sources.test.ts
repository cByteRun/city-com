import { test } from "node:test";
import assert from "node:assert/strict";
import {
  parsePublicHtml,
  parseEnergoDate,
  dialogDetailLinks,
} from "../src/server/public-html";
import { matchesKeywords } from "../src/server/source-contract";
import {
  parseVkComments,
  parseGraphComments,
  parseChannelUpdates,
  PUBLIC_TELEGRAM_CONSENT,
  validateSocialSource,
  sourceTokenName,
} from "../src/server/social-sources";

test("keywords ignore empty comma entries, support case-insensitive RU/KZ and any match", () => {
  assert.equal(matchesKeywords("Нет отопления", " , мусор, "), false);
  assert.equal(matchesKeywords("ЖЫЛУ жоқ", "отопл,жылу"), true);
  assert.equal(matchesKeywords("Любое сообщение", " , "), true);
});
test("Energo extracts resident message only and uses explicit Kazakhstan timezone", () => {
  const rows = parsePublicHtml(
    `<div class="jot-row"><div class="jot-user">Тестовый автор</div><span class="jot-poster">Tue October 20, 2026, 12:38:49</span><div class="jot-message">Нет отопления в доме</div><div class="jot-answer">Чужой ответ не собирать</div></div>`,
    "https://pavlodarenergo.kz/ru/blog-rukovoditelya/obrashhenie.html",
  )!;
  assert.equal(rows.length, 1);
  assert.equal(rows[0].text, "Нет отопления в доме");
  assert.equal(rows[0].publishedAt, "2026-10-20T07:38:49.000Z");
  assert.throws(() => parseEnergoDate("сегодня"));
});
test("Dialog fetch targets are bounded and full appeal excludes official answers and preserves day precision", () => {
  const url = "https://dialog.egov.kz/blogs/all-questions";
  const list =
    '<a class="readmore" href="/blogs/all-questions/123">Подробнее</a><a href="https://evil.test/">External</a>';
  assert.deepEqual(dialogDetailLinks(list, url), [`${url}/123`]);
  const row = parsePublicHtml(
    '<div class="b-question"><form>Поиск</form></div><div class="b-question"><p>Нет горячей воды в доме</p><ul class="blog-info"><li>01.11.2026</li></ul></div><div class="answer"><p>Ответ не собирать</p></div>',
    `${url}/123`,
  )![0];
  assert.equal(row.text, "Нет горячей воды в доме");
  assert.equal(row.publishedAtPrecision, "day");
  assert.throws(() =>
    parsePublicHtml(
      '<div class="b-question"><p>Дата неизвестна</p></div>',
      `${url}/123`,
    ),
  );
});
test("VK normalizes public comments with provenance and measured reactions; API errors are explicit", () => {
  const rows = parseVkComments(
    {
      response: {
        items: [
          {
            id: 3,
            date: 1793510400,
            text: "Нет воды в доме",
            from_id: 42,
            likes: { count: 7 },
          },
          { id: 4, date: 1793510400, text: "Удалено", deleted: true },
        ],
      },
    },
    "-123",
    "456",
  );
  assert.equal(rows.length, 1);
  assert.equal(rows[0].reactions, 7);
  assert.equal(rows[0].url, "https://vk.com/wall-123_456?reply=3");
  assert.throws(() =>
    parseVkComments({ error: { error_code: 5 } }, "-123", "456"),
  );
});
test("Meta supports official Instagram and Facebook comment schemas, skips missing dates", () => {
  assert.equal(
    parseGraphComments(
      {
        data: [
          {
            id: "1",
            text: "Нет отопления",
            timestamp: "2026-11-01T08:00:00+0000",
            like_count: 2,
          },
        ],
      },
      "https://www.instagram.com/p/test/",
    )[0].reactions,
    2,
  );
  assert.equal(
    parseGraphComments(
      {
        data: [
          {
            id: "2",
            message: "Нет отопления",
            created_time: "2026-11-01T08:00:00+0000",
          },
        ],
      },
      "https://www.facebook.com/123/posts/456",
    ).length,
    1,
  );
  assert.equal(
    parseGraphComments(
      { data: [{ id: "3", text: "Дата отсутствует" }] },
      "https://www.instagram.com/p/test/",
    ).length,
    0,
  );
  assert.throws(() =>
    parseGraphComments(
      { error: { code: 190 } },
      "https://www.facebook.com/123",
    ),
  );
});
test("public Telegram channel requires exact opt-in and channel match; never consumes private messages as public", () => {
  const post = {
    message_id: 4,
    date: 1793510400,
    text: `${PUBLIC_TELEGRAM_CONSENT} Нет отопления`,
    chat: { id: -123, type: "channel", username: "owned_channel" },
  };
  const parsed = parseChannelUpdates(
    {
      ok: true,
      result: [
        { update_id: 1, channel_post: post },
        { update_id: 2, channel_post: { ...post, text: "Без согласия" } },
        {
          update_id: 3,
          channel_post: {
            ...post,
            chat: { ...post.chat, username: "another_channel" },
          },
        },
        { update_id: 4, message: { text: "Приватное" } },
      ],
    },
    "owned_channel",
  );
  assert.equal(parsed.rows.length, 1);
  assert.equal(parsed.cursor, 5);
  assert.equal(parsed.rows[0].url, "https://t.me/owned_channel/4");
});
test("social sources validate exact API object and secret slot without exposing tokens", () => {
  assert.equal(sourceTokenName("source-12"), "CITYCOM_SOURCE_12_TOKEN");
  assert.throws(() => sourceTokenName("../../secret"));
  assert.doesNotThrow(() =>
    validateSocialSource({ type: "VK", url: "https://vk.com/tipavlo" }),
  );
  assert.doesNotThrow(() =>
    validateSocialSource({ type: "VK", url: "https://vk.com/wall-123_456" }),
  );
  assert.throws(() =>
    validateSocialSource({
      type: "Instagram",
      url: "https://www.instagram.com/p/test/",
    }),
  );
  assert.throws(() =>
    validateSocialSource({
      type: "Telegram",
      url: "https://t.me/+private_invite",
    }),
  );
});

test("VK group adapter calls official wall and comments APIs with token in POST body", async () => {
  const { collectSocial } = await import("../src/server/social-sources");
  const tokenBefore = process.env.CITYCOM_SOURCE_2_TOKEN;
  const versionBefore = process.env.CITYCOM_VK_API_VERSION;
  const originalFetch = globalThis.fetch;
  const requests: { host: string; path: string; body: URLSearchParams }[] = [];
  process.env.CITYCOM_SOURCE_2_TOKEN = "fixture-token";
  process.env.CITYCOM_VK_API_VERSION = "5.199";
  globalThis.fetch = async (input, init) => {
    const url = new URL(String(input));
    assert.ok(!url.href.includes("fixture-token"));
    const body = new URLSearchParams(String(init?.body));
    requests.push({ host: url.hostname, path: url.pathname, body });
    return Response.json(
      url.pathname.endsWith("wall.get")
        ? { response: { items: [{ id: 456, owner_id: -123 }] } }
        : {
            response: {
              items: [
                { id: 1, date: 1793510400, text: "Нет отопления в доме" },
              ],
            },
          },
    );
  };
  try {
    const result = await collectSocial({
      id: "source-2",
      name: "VK",
      type: "VK",
      url: "https://vk.com/tipavlo",
      enabled: true,
      permission: true,
      intervalMinutes: 60,
      fetched: 0,
      inserted: 0,
      duplicates: 0,
    });
    assert.equal(result.rows.length, 1);
    assert.deepEqual(
      requests.map((r) => r.path),
      ["/method/wall.get", "/method/wall.getComments"],
    );
    assert.ok(
      requests.every(
        (r) =>
          r.host === "api.vk.com" &&
          r.body.get("access_token") === "fixture-token",
      ),
    );
    assert.equal(requests[1].body.get("owner_id"), "-123");
  } finally {
    globalThis.fetch = originalFetch;
    if (tokenBefore === undefined) delete process.env.CITYCOM_SOURCE_2_TOKEN;
    else process.env.CITYCOM_SOURCE_2_TOKEN = tokenBefore;
    if (versionBefore === undefined) delete process.env.CITYCOM_VK_API_VERSION;
    else process.env.CITYCOM_VK_API_VERSION = versionBefore;
  }
});

test("missing social token fails before network and provider errors never leak token", async () => {
  const { collectSocial } = await import("../src/server/social-sources");
  const tokenBefore = process.env.CITYCOM_SOURCE_99_TOKEN;
  const versionBefore = process.env.CITYCOM_GRAPH_API_VERSION;
  const originalFetch = globalThis.fetch;
  const source = {
    id: "source-99",
    name: "IG",
    type: "Instagram" as const,
    url: "https://www.instagram.com/p/test/",
    resourceId: "123",
    enabled: true,
    permission: true,
    intervalMinutes: 60,
    fetched: 0,
    inserted: 0,
    duplicates: 0,
  };
  delete process.env.CITYCOM_SOURCE_99_TOKEN;
  let calls = 0;
  globalThis.fetch = async () => {
    calls++;
    throw new Error("sensitive-provider-url-token");
  };
  try {
    await assert.rejects(collectSocial(source), /CITYCOM_SOURCE_99_TOKEN/);
    assert.equal(calls, 0);
    process.env.CITYCOM_SOURCE_99_TOKEN = "sensitive-provider-url-token";
    process.env.CITYCOM_GRAPH_API_VERSION = "v25.0";
    await assert.rejects(
      collectSocial(source),
      (error: Error) => !error.message.includes("sensitive-provider-url-token"),
    );
    assert.equal(calls, 1);
  } finally {
    globalThis.fetch = originalFetch;
    if (tokenBefore === undefined) delete process.env.CITYCOM_SOURCE_99_TOKEN;
    else process.env.CITYCOM_SOURCE_99_TOKEN = tokenBefore;
    if (versionBefore === undefined)
      delete process.env.CITYCOM_GRAPH_API_VERSION;
    else process.env.CITYCOM_GRAPH_API_VERSION = versionBefore;
  }
});
