import { translate, intlLocales, type Locale } from "@/shared/i18n/translate";
import PDFDocument from "pdfkit";
import { resolve } from "node:path";
export async function buildPDF(
  rows: (string | number)[][],
  summary: {
    locale?: Locale;
    workspace: string;
    total: number;
    direct: number;
    filters: string;
  },
) {
  const locale = summary.locale ?? "ru";
  const t = (value: string, params?: readonly unknown[]) =>
    translate(locale, value, params);
  const doc = new PDFDocument({
    size: "A4",
    margin: 42,
    font: resolve("public/fonts/DejaVuSans.ttf"),
    info: { Title: t("CityCom — Городская обратная связь"), Author: "CityCom" },
  });
  const chunks: Buffer[] = [];
  const result = new Promise<Buffer>((resolve, reject) => {
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });
  doc
    .fontSize(21)
    .fillColor("#19263d")
    .text(t("CityCom · Городская аналитика"));
  doc.moveDown(0.6);
  doc
    .fontSize(10)
    .fillColor("#7989a4")
    .text(
      `${summary.workspace.toUpperCase()} · ${new Date().toLocaleString(intlLocales[locale])}`,
    );
  doc.moveDown();
  doc
    .fillColor("#243754")
    .text(
      t("Обращений: {0} · Direct: {1} (только агрегаты)", [
        summary.total,
        summary.direct,
      ]),
    );
  doc.moveDown(0.5);
  doc
    .fontSize(8)
    .fillColor("#7989a4")
    .text(t("Фильтры: {0}", [summary.filters]));
  doc.moveDown();
  doc.text(
    t(
      "ИИ предлагает решение; итоговое решение принимает сотрудник. Данные DEMO синтетические.",
    ),
  );
  doc.moveDown(1.5);
  for (const row of rows) {
    if (doc.y > 670) doc.addPage();
    doc
      .fillColor("#273c5e")
      .fontSize(11)
      .text(`${row[4]} · ${row[5]} · ${row[11]}`);
    doc.moveDown(0.4);
    doc.fontSize(9).fillColor("#536784").text(String(row[3]));
    doc.moveDown(0.4);
    doc.fontSize(7).fillColor("#92a0b4").text(`${row[1]} · ${row[2]}`);
    if (row[12]) doc.text(String(row[12]), { link: String(row[12]) });
    doc.moveDown(1.5);
  }
  doc.end();
  return result;
}
