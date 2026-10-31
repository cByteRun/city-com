const { chromium, expect } = require("@playwright/test");
const fs = require("node:fs");
const { homedir } = require("node:os");
const { join } = require("node:path");
(async () => {
  const browser = await chromium.launch({
    executablePath:
      process.env.CHROMIUM_PATH ||
      join(
        homedir(),
        ".cache/ms-playwright/chromium-1243/chrome-linux64/chrome",
      ),
    headless: true,
  });
  const page = await browser.newPage({
    viewport: { width: 1600, height: 1100 },
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(`${m.text()} ${m.location().url}`);
  });
  await page.goto(process.env.CITYCOM_BASE_URL || "http://localhost:3100");
  await page
    .getByRole("heading", { name: "Ситуация в городе", exact: true })
    .waitFor();
  await page.evaluate(() => document.fonts.ready);
  const pinName = "Закрепить в разделе: Настроение в источниках";
  await page.getByRole("button", { name: pinName, exact: true }).click();
  await page.reload();
  await expect(
    page.getByRole("button", {
      name: "Открепить: Настроение в источниках",
      exact: true,
    }),
  ).toHaveAttribute("aria-pressed", "true");
  await page
    .getByRole("button", {
      name: "Открепить: Настроение в источниках",
      exact: true,
    })
    .click();
  console.log("pin persistence passed");
  await page.evaluate(() => window.scrollTo(0, 0));
  fs.mkdirSync("docs/design", { recursive: true });
  await page.screenshot({
    path: "docs/design/overview-desktop.png",
    fullPage: true,
  });
  await page
    .locator(".overview-kpis")
    .screenshot({ path: "docs/design/focus-kpis.png" });
  await page
    .locator(".operations-grid")
    .screenshot({ path: "docs/design/focus-priorities.png" });
  console.log(
    "desktop overflow",
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
  );
  const comparison = await browser.newPage({
    viewport: { width: 1500, height: 1100 },
  });
  const ref = fs
    .readFileSync("docs/design/reference-community.jpg")
    .toString("base64");
  const impl = fs
    .readFileSync("docs/design/overview-desktop.png")
    .toString("base64");
  await comparison.setContent(
    `<body style="margin:0;padding:20px;background:#ecefed;font-family:Arial"><div style="display:grid;grid-template-columns:1fr 1fr;gap:20px"><section><h2>Community dashboard reference · 726 × 742</h2><img style="width:100%" src="data:image/jpeg;base64,${ref}"></section><section><h2>CityCom · adapted to the product requirements</h2><img style="width:100%" src="data:image/png;base64,${impl}"></section></div></body>`,
  );
  await comparison.screenshot({
    path: "docs/design/reference-comparison.png",
    fullPage: true,
  });
  await comparison.close();
  await page.getByRole("button", { name: /Разобрать проблему/ }).click();
  await expect(
    page.getByRole("heading", { name: "Почему такой приоритет?" }),
  ).toBeVisible();
  await expect
    .poll(() =>
      page
        .locator(".sheet-content")
        .evaluate(
          (e) => Math.abs(e.getBoundingClientRect().right - innerWidth) < 1,
        ),
    )
    .toBe(true);
  await page.screenshot({ path: "docs/design/issue-detail.png" });
  await page.getByRole("button", { name: "Закрыть", exact: true }).click();
  await page.getByRole("button", { name: /^Ожидают передачи/ }).click();
  await expect(page.getByLabel("Все очереди", { exact: true })).toHaveValue(
    "waiting",
  );
  const response = await page.request.get(
    new URL("/api/data", page.url()).href,
  );
  const { state } = await response.json();
  const expectedWaiting = state.clusters.filter(
    (c) =>
      !c.assignedAt &&
      !["Решено", "Закрыто"].includes(c.status) &&
      state.items.some(
        (i) =>
          i.clusterId === c.id &&
          Date.now() - Date.parse(i.publishedAt) <= 30 * 86400000,
      ),
  ).length;
  await expect(page.locator(".data-table tbody tr")).toHaveCount(
    expectedWaiting,
  );
  await page.getByRole("button", { name: "Сбросить", exact: true }).click();
  console.log("waiting drill-down", expectedWaiting, "issues");
  for (const [label, file] of [
    ["По подразделениям", "departments-desktop"],
    ["Проблемы и приоритеты", "issues-desktop"],
  ]) {
    await page
      .getByRole("button", { name: label, exact: true })
      .first()
      .click();
    await page.screenshot({ path: `docs/design/${file}.png`, fullPage: true });
  }
  await page
    .getByRole("button", { name: "Общая картина", exact: true })
    .click();
  await page.getByRole("button", { name: "Переключить тему" }).click();
  await page.screenshot({
    path: "docs/design/overview-dark.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Переключить тему" }).click();
  await page
    .getByLabel("Поиск по обращениям")
    .fill("__no_matching_citycom_record__");
  await expect(
    page.getByRole("heading", { name: "Нет открытых проблем" }),
  ).toBeVisible();
  await page.screenshot({
    path: "docs/design/overview-empty.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Сбросить", exact: true }).click();
  for (const width of [1440, 1024, 768, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.evaluate(async () => {
      window.scrollTo(0, 0);
      await Promise.allSettled(
        document
          .getAnimations()
          .filter((a) => a.effect?.getTiming().iterations !== Infinity)
          .map((a) => a.finished),
      );
    });
    await expect
      .poll(() =>
        page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      )
      .toBe(true);
    console.log(
      "viewport",
      width,
      "overflow",
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
    );
    if (width === 390)
      await page.screenshot({
        path: "docs/design/overview-mobile.png",
        fullPage: true,
      });
  }
  await page.getByRole("button", { name: "Открыть меню" }).click();
  await page
    .getByRole("button", { name: "По подразделениям", exact: true })
    .first()
    .click();
  await expect(
    page.getByRole("heading", { name: "По подразделениям", exact: true }),
  ).toBeVisible();
  console.log("errors", errors);
  expect(errors).toEqual([]);
  await browser.close();
})();
