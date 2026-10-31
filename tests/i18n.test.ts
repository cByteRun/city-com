import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import {
  dictionaries,
  translate,
  translateAudit,
  parseLocale,
  intlLocales,
  type Locale,
} from "../src/shared/i18n/translate";

test("all three catalogs contain complete translations with matching placeholders", () => {
  const keys = Object.keys(dictionaries.ru).sort();
  for (const locale of ["ru", "en", "kk"] as const) {
    assert.deepEqual(Object.keys(dictionaries[locale]).sort(), keys);
    for (const key of keys) {
      const value = dictionaries[locale][key];
      assert.ok(value.trim(), `${locale}: ${key}`);
      assert.deepEqual(
        [...value.matchAll(/\{\d+\}/g)].map((m) => m[0]).sort(),
        [...key.matchAll(/\{\d+\}/g)].map((m) => m[0]).sort(),
        `${locale}: ${key}`,
      );
      if (locale === "en") assert.doesNotMatch(value, /[А-Яа-яЁё]/, key);
    }
  }
});
test("ISO language codes, interpolation, stable domain values and source text", () => {
  assert.equal(parseLocale("kz"), "kk");
  assert.equal(parseLocale("unknown"), "ru");
  assert.equal(intlLocales.kk, "kk-KZ");
  assert.equal(
    translate("en", "Сохранено {0} обращений; пропущено {1}", [12, 0]),
    "Saved 12 reports; skipped 0",
  );
  assert.equal(translate("kk", "Решено"), "Шешілді");
  const report = "На ул. Лермонтова, 45 нет воды.";
  assert.equal(translate("en", report), report);
  assert.equal(translate("en", "constructor"), "constructor");
  assert.equal(translate("kk", "__proto__"), "__proto__");
  const original = { status: "Решено", text: report };
  assert.equal(translate("en", original), original);
});
// Guard future interface additions against missing dictionary entries.
test("every explicit UI translation key exists in all catalogs", () => {
  function scan(dir: string): string[] {
    return readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
      entry.isDirectory()
        ? scan(join(dir, entry.name))
        : [join(dir, entry.name)],
    );
  }
  for (const file of scan("src").filter(
    (file) => /\.tsx?$/.test(file) && !file.includes("/i18n/"),
  )) {
    const source = readFileSync(file, "utf8");
    for (const match of source.matchAll(/\bt\("([^"\n]+)"/g)) {
      if (!/[А-Яа-яЁё]/.test(match[1])) continue;
      for (const locale of ["ru", "en", "kk"] as Locale[])
        assert.ok(
          dictionaries[locale][match[1]],
          `${file}: ${locale}: ${match[1]}`,
        );
    }
  }
});

test("visible JSX literals are localized and translated options keep explicit values", async () => {
  const { createRequire } = await import("node:module");
  const require = createRequire(import.meta.url);
  const { parse } = require("next/dist/compiled/babel/parser");
  const visibleAttributes = new Set([
    "title",
    "sub",
    "label",
    "placeholder",
    "aria-label",
    "alt",
  ]);
  function scan(dir: string): string[] {
    return readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
      entry.isDirectory()
        ? scan(join(dir, entry.name))
        : [join(dir, entry.name)],
    );
  }
  for (const file of scan("src").filter((file) => file.endsWith(".tsx"))) {
    const ast = parse(readFileSync(file, "utf8"), {
      sourceType: "module",
      plugins: ["typescript", "jsx"],
    });
    function walk(node: any) {
      if (!node || typeof node !== "object") return;
      if (node.type === "JSXText")
        assert.doesNotMatch(
          node.value,
          /[А-Яа-яЁё]/,
          `${file}: untranslated JSX text`,
        );
      if (
        node.type === "JSXAttribute" &&
        visibleAttributes.has(node.name.name) &&
        node.value?.type === "StringLiteral"
      )
        assert.doesNotMatch(
          node.value.value,
          /[А-Яа-яЁё]/,
          `${file}: untranslated attribute`,
        );
      if (node.type === "JSXOpeningElement" && node.name.name === "option")
        assert.ok(
          node.attributes.some(
            (attribute: any) => attribute.name?.name === "value",
          ),
          `${file}: localized options need stable values`,
        );
      for (const [key, value] of Object.entries(node)) {
        if (["loc", "extra"].includes(key)) continue;
        if (Array.isArray(value)) value.forEach(walk);
        else if (value && typeof value === "object") walk(value);
      }
    }
    walk(ast);
  }
});

test("stored audit messages localize parameters without rewriting originals", () => {
  assert.equal(
    translateAudit("en", "Подтверждено: ЖКХ · Решено"),
    "Confirmed: Housing and utilities · Resolved",
  );
  assert.equal(
    translateAudit(
      "kk",
      "Экспорт CSV: 12 публичных записей; Direct только агрегат",
    ),
    "CSV экспорты: 12 жария жазба; жеке хабарламалар тек жиынтық түрде",
  );
});
