import ru from "./ru.json";
import en from "./en.json";
import kk from "./kk.json";

// kk is the ISO 639-1 language code; KZ is the country code shown in the UI.
export type Locale = "ru" | "en" | "kk";
export const locales: readonly Locale[] = ["ru", "en", "kk"];
export const intlLocales: Record<Locale, string> = {
  ru: "ru-RU",
  en: "en-GB",
  kk: "kk-KZ",
};
export const dictionaries: Record<Locale, Record<string, string>> = {
  ru,
  en,
  kk,
};
export const parseLocale = (value: unknown): Locale =>
  value === "en" || value === "kk" ? value : value === "kz" ? "kk" : "ru";
export function translate<T>(
  locale: Locale,
  value: T,
  params?: readonly unknown[],
): T {
  if (typeof value !== "string") return value;
  const catalog = dictionaries[locale];
  const message = Object.hasOwn(catalog, value) ? catalog[value] : value;
  return (
    params
      ? message.replace(/\{(\d+)\}/g, (token, index) =>
          String(params[Number(index)] ?? token),
        )
      : message
  ) as T;
}

// Older audit entries store readable Russian messages. Translate only known
// system templates; the immutable audit record and user-provided text stay intact.
export function translateAudit(locale: Locale, value: string): string {
  let match = /^Подтверждено: (.+) · (.+)$/u.exec(value);
  if (match)
    return translate(locale, "Подтверждено: {0} · {1}", [
      translate(locale, match[1]),
      translate(locale, match[2]),
    ]);
  match =
    /^Экспорт (CSV|XLSX|PDF): (\d+) публичных записей; Direct только агрегат$/u.exec(
      value,
    );
  if (match)
    return translate(
      locale,
      "Экспорт {0}: {1} публичных записей; Direct только агрегат",
      match.slice(1),
    );
  match = /^(Сбор|Импорт): (\d+) новых, (\d+) дубликатов \/ спам$/u.exec(value);
  if (match)
    return translate(locale, "{0}: {1} новых, {2} дубликатов / спам", [
      translate(locale, match[1]),
      match[2],
      match[3],
    ]);
  return translate(locale, value);
}
