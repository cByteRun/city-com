import { test } from "node:test";
import assert from "node:assert/strict";
import {
  maskPII,
  demoAnalyze,
  insertItem,
  scope,
  filterItems,
  priority,
} from "../src/server/domain";
import { seed } from "../src/server/seed";
import { gold } from "../src/server/quality";
const row = (text: string) => ({
  text,
  sourceId: "source-1",
  url: "https://example.org/public/1",
  publishedAt: new Date().toISOString(),
  authorId: "resident",
});
test("PII removed before storage including private address", () => {
  const masked = maskPII(
    "Меня зовут Иван Иванов. ИИН 900101123456, +7 (701) 123-45-67, test@example.kz. ул. Мира 10 кв. 25",
    true,
  );
  for (const value of [
    "900101123456",
    "123-45-67",
    "test@example.kz",
    "Мира 10",
    "Иван Иванов",
  ])
    assert.ok(!masked.includes(value), masked);
});
test("cross-source duplicates cannot increase issue volume", () => {
  const s = seed(false);
  const r = row("На ул. Лермонтова 44 нет отопления.");
  const a = demoAnalyze(r.text);
  assert.ok(insertItem(s, r, a, 1, "demo"));
  assert.equal(
    insertItem(s, { ...r, sourceId: "source-2" }, a, 1, "demo"),
    null,
  );
  assert.equal(s.items.length, 1);
});
test("unknown locations and different addresses stay separate", () => {
  const s = seed(false);
  for (const text of [
    "На ул. Мира 10 нет воды.",
    "На ул. Мира 11 нет воды.",
    "Нет воды возле дома.",
    "Воды нет в доме.",
  ])
    insertItem(s, row(text), demoAnalyze(text), 1, "demo");
  assert.equal(s.clusters.length, 4);
});
test("same topic and address merge and urgent growth has an explainable priority", () => {
  const s = seed(false);
  for (let n = 0; n < 5; n++) {
    const r = row(`На ул. Мира 10 нет отопления, дети мерзнут. Сообщение ${n}`);
    insertItem(
      s,
      { ...r, authorId: `author-${n}` },
      demoAnalyze(r.text),
      1,
      "demo",
    );
  }
  assert.equal(s.clusters.length, 1);
  const p = priority(s.clusters[0], s.items);
  assert.equal(p.independent, 5);
  assert.equal(p.label, "high");
  assert.equal(
    p.score,
    Object.values(p.factors).reduce((a, b) => a + b, 0),
  );
});
test("department scope prevents cross-department disclosure and Direct texts remain masked", () => {
  const s = seed(true);
  const scoped = scope(s, {
    role: "department",
    department: "ЖКХ",
    workspace: "demo",
    name: "Test",
  });
  assert.ok(scoped.items.every((i) => i.department === "ЖКХ"));
  assert.ok(scoped.clusters.every((c) => c.department === "ЖКХ"));
  assert.ok(
    scoped.items
      .filter((i) => i.private)
      .every((i) => i.text.startsWith("Приватное обращение")),
  );
  assert.equal(scoped.audit.length, 0);
});
test("global filters constrain exact issue and sentiment", () => {
  const s = seed(true);
  const c = s.clusters[0];
  const filtered = filterItems(s, {
    problem: c.id,
    sentiment: "negative",
    department: c.department,
  });
  assert.ok(filtered.length > 0);
  assert.ok(
    filtered.every(
      (i) =>
        i.clusterId === c.id &&
        i.sentiment === "negative" &&
        i.department === c.department,
    ),
  );
});
test("RU/KZ smoke classifier meets targets on a small labeled set only", () => {
  let sentiments = 0,
    deps = 0;
  for (const [text, department, sentiment] of gold) {
    const result = demoAnalyze(text);
    if (result.department === department) deps++;
    if (result.sentiment === sentiment) sentiments++;
  }
  assert.ok(sentiments / gold.length >= 0.8, `${sentiments}/${gold.length}`);
  assert.ok(deps / gold.length >= 0.75, `${deps}/${gold.length}`);
});

test("operational queues preserve department scope and exclude completed issues from triage", () => {
  const s = seed(true);
  const now = Date.now();
  const waiting = filterItems(s, { queue: "waiting", department: "ЖКХ" }, now);
  const expected = s.clusters.filter(
    (c) =>
      c.department === "ЖКХ" &&
      !c.assignedAt &&
      !["Решено", "Закрыто"].includes(c.status),
  );
  assert.ok(waiting.length > 0);
  assert.deepEqual(
    new Set(waiting.map((i) => i.clusterId)),
    new Set(expected.map((c) => c.id)),
  );
  const completed = filterItems(s, { queue: "resolved" }, now);
  assert.ok(completed.length > 0);
  assert.ok(
    completed.every((i) =>
      s.clusters.some(
        (c) => c.id === i.clusterId && ["Решено", "Закрыто"].includes(c.status),
      ),
    ),
  );
  const hot = filterItems(s, { queue: "hot" }, now);
  assert.ok(hot.length > 0);
  assert.ok(
    hot.every((i) =>
      s.clusters.some(
        (c) =>
          c.id === i.clusterId &&
          !["Решено", "Закрыто"].includes(c.status) &&
          priority(c, s.items, now).recent >= 3,
      ),
    ),
  );
});
