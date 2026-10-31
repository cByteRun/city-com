import { test, expect } from "@playwright/test";
test("P0: classify, deduplicate, cluster, assign, review, export and enforce roles", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Ситуация в городе", exact: true }),
  ).toBeVisible();
  await page.request.post("/api/action", { data: { action: "reset" } });
  await page.reload();
  await expect(
    page.getByRole("button", { name: /Всего обращений/ }),
  ).toBeVisible();
  await page.screenshot({
    path: "artifacts/overview-desktop.png",
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Проблемы и приоритеты", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Реестр городских проблем" }),
  ).toBeVisible();
  await page.locator('tr[aria-label^="Открыть:"]').first().click();
  await expect(
    page.getByRole("heading", { name: "Почему такой приоритет?" }),
  ).toBeVisible();
  await page
    .getByRole("combobox", { name: "Статус", exact: true })
    .selectOption("Передано");
  await page.getByRole("button", { name: "Подтвердить решение" }).click();
  await expect(page.getByRole("status")).toContainText(
    "Назначение и статус сохранены",
  );
  await page.screenshot({ path: "artifacts/issue-drawer.png" });
  await page.getByRole("button", { name: "Закрыть", exact: true }).click();
  await page.getByRole("button", { name: "AI-обработка", exact: true }).click();
  await page
    .getByLabel("Текст обращения")
    .fill("На ул. Тестовая 998 нет отопления, дети мерзнут. Северный район.");
  await page
    .getByText("Подтверждаю: это синтетические данные для демонстрации.")
    .click();
  await page.getByRole("button", { name: "Анализировать обращение" }).click();
  await expect(
    page.getByRole("heading", { name: "Обработка завершена" }),
  ).toBeVisible();
  await expect(page.locator(".processing-result")).toContainText(
    "Сохранено: 1",
  );
  await page.getByRole("button", { name: "Анализировать обращение" }).click();
  await expect(page.locator(".processing-result")).toContainText(
    "Дубликаты / спам: 1",
  );
  await page.getByRole("button", { name: "Открыть ленту" }).click();
  await page.getByLabel("Поиск по обращениям").fill("Тестовая 998");
  await expect(page.locator("tbody tr")).toHaveCount(1);
  await page.locator("tbody tr").first().click();
  await expect(
    page.getByText("Обоснование классификации", { exact: true }),
  ).toBeVisible();
  await page
    .getByLabel("Почему это решение верно?")
    .fill("Проверен текст: отсутствие отопления, сфера ЖКХ.");
  await page.getByRole("button", { name: "Подтвердить классификацию" }).click();
  await expect(page.getByRole("status")).toContainText(
    "Классификация подтверждена",
  );
  await page.getByRole("button", { name: "Закрыть", exact: true }).click();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "CSV", exact: true }).click();
  const csv = await download;
  expect(csv.suggestedFilename()).toBe("citycom.csv");
  await page.getByRole("button", { name: "Сбросить", exact: true }).click();
  await page
    .getByRole("button", { name: "Качество и KPI", exact: true })
    .click();
  await page.getByRole("button", { name: "Запустить проверку" }).click();
  await expect(
    page.getByRole("heading", { name: "Протокол оценки" }),
  ).toBeVisible();
  await expect(page.locator(".quality-card").first()).toContainText("%");
  const viewer = await page.request.post("/api/session", {
    data: { workspace: "demo", role: "viewer" },
  });
  expect(viewer.ok()).toBeTruthy();
  const denied = await page.request.post("/api/action", {
    data: { action: "reset" },
  });
  expect(denied.status()).toBe(403);
  const department = await page.request.post("/api/session", {
    data: { workspace: "demo", role: "department" },
  });
  expect(department.ok()).toBeTruthy();
  const scoped = await (await page.request.get("/api/data")).json();
  expect(
    scoped.state.items.every((i: any) => i.department === "ЖКХ"),
  ).toBeTruthy();
  const live = await page.request.post("/api/session", {
    data: { workspace: "live", role: "admin", password: "" },
  });
  expect(live.ok()).toBeFalsy();
  expect(errors).toEqual([]);
});
test("responsive mobile navigation and no horizontal viewport overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Ситуация в городе", exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: "artifacts/overview-mobile.png",
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBeTruthy();
  await page.getByRole("button", { name: "Открыть меню" }).click();
  await page
    .getByRole("button", { name: "По подразделениям", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "По подразделениям", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBeTruthy();
  await page.screenshot({
    path: "artifacts/departments-mobile.png",
    fullPage: true,
  });
});
test("Direct stays private in exports; PDF/XLSX are real files; admin directory persists", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Ситуация в городе", exact: true }),
  ).toBeVisible();
  const r = await page.request.post("/api/action", {
    data: {
      action: "ingest",
      sourceId: "source-1",
      private: true,
      approved: true,
      rows: [
        {
          text: "Меня зовут Иван Иванов. ИИН 900101123456. +7 (701) 123-45-67. На ул. Мира 989 нет воды.",
          url: "",
          publishedAt: new Date().toISOString(),
        },
      ],
    },
  });
  expect(r.ok()).toBeTruthy();
  const data = await r.json();
  const direct = data.state.items.find(
    (i: any) => i.private && Date.parse(i.ingestedAt) > Date.now() - 60000,
  );
  expect(direct).toBeTruthy();
  expect(direct.text).not.toContain("Иван");
  const reveal = await page.request.post("/api/action", {
    data: { action: "private", id: direct.id },
  });
  const priv = await reveal.json();
  expect(reveal.ok()).toBeTruthy();
  expect(priv.result.text).not.toContain("900101123456");
  expect(priv.result.text).not.toContain("Мира 989");
  const csv = await page.request.get("/api/export?format=csv");
  expect(await csv.text()).not.toContain("900101123456");
  expect(await csv.text()).not.toContain(direct.id);
  const xlsx = await page.request.get("/api/export?format=xlsx");
  expect(xlsx.ok()).toBeTruthy();
  expect((await xlsx.body()).subarray(0, 2).toString()).toBe("PK");
  const pdf = await page.request.get("/api/export?format=pdf");
  expect(pdf.ok()).toBeTruthy();
  expect((await pdf.body()).subarray(0, 5).toString()).toBe("%PDF-");
  const directory = data.state.directory[0];
  const edit = await page.request.post("/api/action", {
    data: {
      action: "department",
      id: directory.id,
      topics: "Отопление, водоснабжение, коммунальные аварии",
      responsible: "Дежурный специалист",
    },
  });
  expect(edit.ok()).toBeTruthy();
  const updated = await (await page.request.get("/api/data")).json();
  expect(updated.state.directory[0].responsible).toBe("Дежурный специалист");
  await page.request.post("/api/session", {
    data: { workspace: "demo", role: "viewer" },
  });
  const denied = await page.request.post("/api/action", {
    data: { action: "private", id: direct.id },
  });
  expect(denied.status()).toBe(403);
  await page.request.post("/api/session", {
    data: { workspace: "demo", role: "admin" },
  });
  await page.request.post("/api/action", { data: { action: "reset" } });
});
test("all workspaces render and CSV upload runs through pipeline", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Ситуация в городе", exact: true }),
  ).toBeVisible();
  for (const [label, title, file] of [
    ["По подразделениям", "По подразделениям", "departments"],
    ["Источники", "Источники данных", "sources"],
    ["Качество и KPI", "Качество и KPI", "quality"],
    ["Администрирование", "Администрирование", "settings"],
    ["AI-ассистент", "AI-ассистент", "chat"],
  ]) {
    await page.getByRole("button", { name: label, exact: true }).click();
    await expect(
      page.getByRole("heading", { name: title, exact: true }),
    ).toBeVisible();
    await page.screenshot({
      path: `artifacts/${file}-desktop.png`,
      fullPage: true,
    });
  }
  await page.getByRole("button", { name: "AI-обработка", exact: true }).click();
  await page.locator("input[type=file]").setInputFiles({
    name: "test.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(
      `text,url,publishedAt,authorId\n"На ул. Мира 765 нет воды.",,${new Date().toISOString()},csv-test\n`,
    ),
  });
  await expect(
    page.getByRole("button", { name: "Обработать 1 записей" }),
  ).toBeVisible();
  await page
    .getByText("Подтверждаю: это синтетические данные для демонстрации.")
    .click();
  await page.getByRole("button", { name: "Обработать 1 записей" }).click();
  await expect(page.locator(".processing-result")).toContainText(
    "Сохранено: 1",
  );
  await page.request.post("/api/action", { data: { action: "reset" } });
});

test("FSD: access form and saved filter scenario remain connected", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Ситуация в городе", exact: true }),
  ).toBeVisible();
  await page
    .getByLabel("Все подразделения", { exact: true })
    .selectOption("ЖКХ");
  await page.getByRole("button", { name: "Сохранить", exact: true }).click();
  await page.getByRole("button", { name: "Сбросить", exact: true }).click();
  await page.getByRole("button", { name: "Мои фильтры", exact: true }).click();
  await expect(
    page.getByLabel("Все подразделения", { exact: true }),
  ).toHaveValue("ЖКХ");
  await page.locator(".user-menu").click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await dialog
    .getByRole("combobox", { name: "Роль", exact: true })
    .selectOption("viewer");
  await dialog
    .getByRole("button", { name: "Войти в demo", exact: true })
    .click();
  await expect(page.locator(".user-menu")).toContainText("Просмотр");
  expect(
    (await (await page.request.get("/api/session")).json()).user.role,
  ).toBe("viewer");
  await page.request.post("/api/session", {
    data: { workspace: "demo", role: "admin" },
  });
});
