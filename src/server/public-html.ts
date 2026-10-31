import { load } from "cheerio";
import { incomingSchema, type Incoming } from "./source-contract";

const months = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
];
export function parseEnergoDate(value: string) {
  const match = value.match(
    /\b([A-Za-z]+)\s+(\d{1,2}),\s*(\d{4}),\s*(\d{2}:\d{2}:\d{2})/,
  );
  if (!match) throw new Error("Неизвестный формат даты ПАВЛОДАРЭНЕРГО");
  const month = months.indexOf(match[1].toLowerCase());
  if (month < 0) throw new Error("Неизвестный месяц");
  return new Date(
    `${match[3]}-${String(month + 1).padStart(2, "0")}-${match[2].padStart(2, "0")}T${match[4]}+05:00`,
  ).toISOString();
}
export function dialogDetailLinks(raw: string, value: string) {
  const url = new URL(value);
  if (
    url.hostname !== "dialog.egov.kz" ||
    url.pathname !== "/blogs/all-questions"
  )
    return [];
  const $ = load(raw);
  return [
    ...new Set(
      $("a.readmore[href^='/blogs/all-questions/']")
        .map((_, element) => new URL($(element).attr("href")!, url).href)
        .get(),
    ),
  ].slice(0, 3);
}
export function parsePublicHtml(
  raw: string,
  value: string,
): Incoming[] | undefined {
  const url = new URL(value);
  const $ = load(raw);
  const rows: Incoming[] = [];
  if (
    url.hostname === "pavlodarenergo.kz" &&
    url.pathname === "/ru/blog-rukovoditelya/obrashhenie.html"
  ) {
    $(".jot-row").each((_, element) => {
      const item = $(element);
      const text = item.find(".jot-message").text().replace(/\s+/g, " ").trim();
      if (!text) return;
      rows.push(
        incomingSchema.parse({
          text,
          url: url.href,
          publishedAt: parseEnergoDate(item.find(".jot-poster").text()),
          publishedAtPrecision: "second",
          authorId: item.find(".jot-user").text().trim(),
        }),
      );
    });
  } else if (
    url.hostname === "dialog.egov.kz" &&
    /^\/blogs\/all-questions\/\d+$/.test(url.pathname)
  ) {
    const item = $(".b-question")
      .filter((_, element) => $(element).children("ul.blog-info").length > 0)
      .first();
    const date = item
      .find("ul.blog-info li")
      .text()
      .match(/(\d{2})\.(\d{2})\.(\d{4})/);
    const text = item.children("p").text().trim();
    if (!date || !text)
      throw new Error(
        "Не найдены полный текст и дата обращения Открытого диалога",
      );
    rows.push(
      incomingSchema.parse({
        text,
        url: url.href,
        publishedAt: new Date(
          `${date[3]}-${date[2]}-${date[1]}T00:00:00+05:00`,
        ).toISOString(),
        publishedAtPrecision: "day",
      }),
    );
  } else if (
    url.hostname === "dialog.egov.kz" &&
    url.pathname === "/blogs/all-questions"
  ) {
    $("a.readmore[href^='/blogs/all-questions/']").each((_, element) => {
      const link = $(element);
      const item = link.parent();
      const day = item
        .children("ul.blog-info")
        .find("li")
        .eq(1)
        .text()
        .match(/(\d{2})\.(\d{2})\.(\d{4})/);
      if (!day)
        throw new Error("В обращении Открытого диалога отсутствует дата");
      const text = item
        .children("p")
        .map((_, p) => $(p).text())
        .get()
        .join(" ")
        .trim();
      // Listing previews may be truncated. Never treat a preview as a complete appeal.
      if (!text || /(?:\.\.\.|…)\s*$/.test(text)) return;
      rows.push(
        incomingSchema.parse({
          text,
          url: new URL(link.attr("href")!, url).href,
          publishedAt: new Date(
            `${day[3]}-${day[2]}-${day[1]}T00:00:00+05:00`,
          ).toISOString(),
          publishedAtPrecision: "day",
        }),
      );
    });
  } else return undefined;
  if (!rows.length && !dialogDetailLinks(raw, value).length)
    throw new Error(
      "Нет полных обращений с датами: проверьте разметку/выгрузку источника",
    );
  return rows.slice(0, 200);
}
