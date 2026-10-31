import { test } from "node:test";
import assert from "node:assert/strict";
import {
  incomingSchema,
  connectors,
  telegramRows,
  DIRECT_CONSENT,
  syncDemo,
} from "../src/server/connectors";
import { analysisSchema, safePublicUrl } from "../src/server/domain";
test("invalid AI response cannot enter storage", () => {
  assert.equal(
    analysisSchema.safeParse({ department: "arbitrary", confidence: 2 })
      .success,
    false,
  );
});
test("import contract rejects missing provenance dates and oversized payloads", () => {
  assert.equal(incomingSchema.safeParse({ text: "Hello" }).success, false);
  assert.equal(
    incomingSchema.safeParse({
      text: "x".repeat(10001),
      publishedAt: new Date().toISOString(),
    }).success,
    false,
  );
});
test("connector adapters share normalized contract", () => {
  const json = connectors.JSON(
    JSON.stringify([
      {
        text: "Нет воды в доме",
        url: "https://example.org/1",
        publishedAt: "2026-10-31T10:00:00.000Z",
      },
    ]),
  );
  const rss = connectors.RSS(
    "<rss><channel><item><description>Нет воды в доме</description><link>https://example.org/1</link><pubDate>Sat, 31 Oct 2026 10:00:00 GMT</pubDate></item></channel></rss>",
  );
  assert.equal(json[0].text, rss[0].text);
  assert.equal(json[0].publishedAt, rss[0].publishedAt);
});
test("source links cannot execute javascript or contain tokens", () => {
  assert.equal(safePublicUrl("javascript:alert(1)"), "");
  assert.equal(
    safePublicUrl("https://example.org/post?token=secret#private"),
    "https://example.org/post",
  );
});

test("HTML collects structured resident comments and rejects pages without provenance", () => {
  const raw = `<script type="application/ld+json">${JSON.stringify({
    "@graph": [
      {
        "@type": "Comment",
        text: "Нет воды в доме",
        datePublished: "2026-11-01T08:00:00.000Z",
        url: "https://portal.kz/1",
      },
      { "@type": "Article", text: "Новости города" },
    ],
  })}</script>`;
  assert.equal(connectors.HTML(raw).length, 1);
  assert.throws(() => connectors.HTML("<html>Войдите в аккаунт</html>"));
});
test("Telegram accepts only explicitly consented private messages, advances cursor over skipped updates", () => {
  const message = {
    message_id: 1,
    date: 1793510400,
    chat: { id: 42, type: "private" },
    text: `${DIRECT_CONSENT} Нет отопления в доме`,
  };
  const result = telegramRows({
    ok: true,
    result: [
      { update_id: 1, message },
      { update_id: 2, message: { ...message, text: "Без согласия" } },
      {
        update_id: 3,
        message: { ...message, chat: { id: 42, type: "group" } },
      },
    ],
  });
  assert.equal(result.rows.length, 1);
  assert.equal(result.rows[0].text, "Нет отопления в доме");
  assert.equal(result.skipped, 2);
  assert.equal(result.cursor, 4);
  assert.throws(() => telegramRows({ ok: false, result: [] }));
});

test("DEMO collection populates each public source and Direct and stays idempotent", async () => {
  const { sources } = await import("../src/server/seed");
  const { readState } = await import("../src/server/store");
  for (const source of sources(true)) {
    await syncDemo(source, "test");
    assert.ok(
      readState("demo").items.some((item) => item.sourceId === source.id),
    );
    const repeated = await syncDemo(source, "test");
    assert.equal(repeated.inserted, 0);
    assert.equal(repeated.duplicates, 2);
  }
});

test("LIVE private text is encrypted in SQLite and expired Direct is removed", async () => {
  const { mutate, readState } = await import("../src/server/store");
  const { seed } = await import("../src/server/seed");
  const { DatabaseSync } = await import("node:sqlite");
  const original = readState("live");
  const previousKey = process.env.CITYCOM_DIRECT_KEY;
  process.env.CITYCOM_DIRECT_KEY = "ab".repeat(32);
  const item = seed(true).items.find((row) => row.private)!;
  item.text = "Уникальный приватный текст для проверки шифрования";
  item.ingestedAt = new Date().toISOString();
  try {
    mutate("live", (state) => {
      state.items.push(item);
    });
    const db = new DatabaseSync(
      process.env.CITYCOM_DB_PATH || "data/citycom.sqlite",
    );
    const raw = db
      .prepare("SELECT body FROM workspaces WHERE id='live'")
      .get() as { body: string };
    db.close();
    assert.ok(!raw.body.includes(item.text));
    assert.ok(raw.body.includes("enc-v1:"));
    assert.equal(
      readState("live").items.find((row) => row.id === item.id)?.text,
      item.text,
    );
    mutate("live", (state) => {
      state.items.find((row) => row.id === item.id)!.ingestedAt =
        "2020-01-01T00:00:00.000Z";
    });
    assert.ok(!readState("live").items.some((row) => row.id === item.id));
  } finally {
    mutate("live", (state) => Object.assign(state, original));
    if (previousKey === undefined) delete process.env.CITYCOM_DIRECT_KEY;
    else process.env.CITYCOM_DIRECT_KEY = previousKey;
  }
});
