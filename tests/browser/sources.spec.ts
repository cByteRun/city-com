import { test, expect } from "@playwright/test";

test("source settings persist and DEMO collection updates data through the API", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await page.request.post("/api/session", {
    data: { workspace: "demo", role: "admin" },
  });
  await page.request.post("/api/action", { data: { action: "reset" } });
  await page.reload();
  await page.getByRole("button", { name: "Источники", exact: true }).click();
  const row = page.locator(".source-row").first();
  await row.getByText("Настроить источник", { exact: true }).click();
  await row
    .getByLabel("Название", { exact: true })
    .fill("Портал обращений · тест");
  await row.getByLabel("Метод", { exact: true }).selectOption("HTML");
  await row.getByLabel("Город источника").fill("Павлодар");
  await row.getByLabel("Область источника").fill("Павлодарская");
  await row.getByLabel("Теги источника через запятую").fill("ЖКХ, отопление");
  await row
    .getByLabel("Ключевые слова через запятую (любое совпадение)")
    .fill("отопление, қоқыс");
  await row
    .getByLabel("Основание сбора и AI-обработки")
    .fill(
      "Синтетическая демонстрационная выборка, не реальные персональные данные",
    );
  await row.getByRole("button", { name: "Сохранить настройки" }).click();
  await expect(page.getByRole("status")).toContainText(
    "Настройки источника сохранены",
  );
  await expect(row).toContainText("Портал обращений · тест");
  await row.getByRole("button", { name: "Собрать", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("DEMO: сохранено 2");
  await row.getByRole("button", { name: "Собрать", exact: true }).click();
  await expect(page.getByRole("status")).toContainText(
    "DEMO: сохранено 0, повторов 2",
  );
  const direct = page.locator(".source-row").last();
  await direct.getByRole("button", { name: "Собрать", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("DEMO:");
  await page.reload();
  await expect(page.locator(".source-row").first()).toContainText(
    "Портал обращений · тест",
  );
  await page.screenshot({
    path: "artifacts/sources-settings.png",
    fullPage: true,
  });
  await expect(page.locator(".source-row").first()).toContainText(
    "Павлодарская",
  );
  await page
    .getByRole("button", { name: "Добавить источник", exact: true })
    .click();
  await expect(page.locator(".source-row")).toHaveCount(5);
  await expect(page.locator(".source-row").last()).toContainText("source-4");
  const created = await page.request.post("/api/action", {
    data: { action: "sync", id: "source-4" },
  });
  // New source is paused until the administrator configures and enables it.
  expect(created.ok()).toBeFalsy();
  expect(errors).toEqual([]);
});

test("LIVE source probe reads real HTML without Gemini or permission to ingest", async ({
  page,
}) => {
  test.skip(
    !process.env.CITYCOM_BROWSER_TEST_PASSWORD,
    "Uses a dedicated local server and test database",
  );
  const login = await page.request.post("/api/session", {
    data: {
      workspace: "live",
      role: "admin",
      password: process.env.CITYCOM_BROWSER_TEST_PASSWORD,
    },
  });
  expect(login.ok()).toBeTruthy();
  const saved = await page.request.post("/api/action", {
    data: {
      action: "source",
      id: "source-1",
      name: "ПАВЛОДАРЭНЕРГО · проверка",
      type: "HTML",
      url: "https://pavlodarenergo.kz/ru/blog-rukovoditelya/obrashhenie.html",
      enabled: true,
      intervalMinutes: 60,
      permission: false,
      permissionBasis: "",
      keywords: "",
      city: "Павлодар",
      region: "Павлодарская",
      tags: "ЖКХ",
    },
  });
  expect(saved.ok()).toBeTruthy();
  await page.goto("/?view=sources");
  const row = page.locator(".source-row").first();
  await row.getByRole("button", { name: "Проверить API", exact: true }).click();
  await expect(page.getByRole("status")).toContainText(
    /Проверка: получено [1-9]/,
  );
  const denied = await page.request.post("/api/action", {
    data: { action: "sync", id: "source-1" },
  });
  expect(denied.ok()).toBeFalsy();
  const body = await denied.json();
  expect(body.error).toContain("разрешение");
  await page.screenshot({
    path: "artifacts/sources-live-probe.png",
    fullPage: true,
  });
});
