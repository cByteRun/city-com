import { test, expect } from "@playwright/test";
import ExcelJS from "exceljs";
import { dictionaries } from "../../src/shared/i18n/translate";

test("EN/RU/KZ: translate screens, preserve filters, persist language and localize exports", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.locator(".language-switch select")).toBeVisible();
  const picker = page.locator(".language-switch select");
  await page
    .getByRole("combobox", { name: "Период", exact: true })
    .selectOption("7");
  const screens = [
    "Общая картина",
    "По подразделениям",
    "Проблемы и приоритеты",
    "Лента обращений",
    "AI-обработка",
    "Модерация",
    "Источники",
    "Качество и KPI",
    "Администрирование",
    "AI-ассистент",
  ];
  for (const locale of ["en", "kk", "ru"] as const) {
    await picker.selectOption(locale);
    await expect(page.locator("html")).toHaveAttribute("lang", locale);
    await expect(
      page.getByRole("combobox", {
        name: dictionaries[locale]["Период"],
        exact: true,
      }),
    ).toHaveValue("7");
    for (const screen of screens) {
      await page
        .locator("nav")
        .getByText(dictionaries[locale][screen], { exact: true })
        .click();
      await expect(page.locator("main h1")).toBeVisible();
      // All known Russian UI messages must disappear in translated interfaces.
      // Original resident reports, AI output, source names and editable content are data.
      if (locale !== "ru") {
        const untranslated = await page.locator("body").evaluate(
          (body, keys) => {
            const walker = document.createTreeWalker(
              body,
              NodeFilter.SHOW_TEXT,
            );
            const found: string[] = [];
            while (walker.nextNode()) {
              const node = walker.currentNode;
              const element = node.parentElement;
              if (
                !element ||
                element.closest(
                  "script, style, option, textarea, .chat-question, .feed-text, .quote-block, .originals, .explanation",
                )
              )
                continue;
              const value = node.textContent?.trim() || "";
              if (keys.includes(value) && element.getClientRects().length)
                found.push(value);
            }
            return [...new Set(found)];
          },
          Object.keys(dictionaries.ru).filter(
            (key) =>
              /[А-Яа-яЁё]/.test(key) && dictionaries[locale][key] !== key,
          ),
        );
        expect(untranslated, `${locale}: ${screen}`).toEqual([]);
      }
    }
  }
  await picker.selectOption("en");
  await page.reload();
  await expect(picker).toHaveValue("en");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "CSV", exact: true }).click();
  const file = await download;
  const stream = await file.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream!) chunks.push(Buffer.from(chunk));
  expect(Buffer.concat(chunks).toString("utf8")).toContain('"Department"');
  // Dialogs and controlled values use translated labels with stable persisted values.
  await page
    .locator("nav")
    .getByText("Issues and priorities", { exact: true })
    .click();
  await page.locator("tbody tr").first().click();
  await expect(
    page.getByRole("heading", { name: "Why this priority?" }),
  ).toBeVisible();
  const status = page.getByRole("combobox", { name: "Status", exact: true });
  await expect(status.locator('option[value="Решено"]')).toHaveText("Resolved");
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await page.getByRole("button", { name: "User guide", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "How to use CityCom" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await page.locator("nav").getByText("AI processing", { exact: true }).click();
  const residentText = "Тест: жылу жоқ. Сохранить исходный текст жителя.";
  await page
    .getByRole("textbox", { name: "Report text", exact: true })
    .fill(residentText);
  await picker.selectOption("kk");
  await expect(
    page.getByRole("textbox", { name: "Өтініш мәтіні", exact: true }),
  ).toHaveValue(residentText);
  // CSV, XLSX and PDF receive the same selected locale without translating resident text.
  const xlsx = await page.request.get("/api/export?format=xlsx&locale=kk");
  expect(xlsx.ok()).toBeTruthy();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(new Uint8Array(await xlsx.body()).buffer);
  expect(workbook.worksheets[0].getRow(1).getCell(5).value).toBe("Бөлім");
  const pdf = await page.request.get("/api/export?format=pdf&locale=kk");
  expect(pdf.ok()).toBeTruthy();
  expect((await pdf.body()).subarray(0, 4).toString()).toBe("%PDF");
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(picker).toBeVisible();
  await picker.selectOption("kk");
  await expect(page.locator("html")).toHaveAttribute("lang", "kk");
  expect(errors).toEqual([]);
});
