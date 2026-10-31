import { test } from "node:test";
import assert from "node:assert/strict";
import { incomingSchema, connectors } from "../src/server/connectors";
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

