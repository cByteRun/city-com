const { chromium } = require("@playwright/test");
(async () => {
  const b = await chromium.launch({
    executablePath:
      "/home/ev0b1t/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome",
    headless: true,
  });
  const p = await b.newPage();
  p.on("console", (m) => console.log("CONSOLE", m.type(), m.text()));
  p.on("pageerror", (e) => console.log("ERROR", e.message));
  p.on("request", (r) => console.log("REQUEST", r.method(), r.url()));
  p.on("response", (r) => console.log("HTTP", r.status(), r.url()));
  p.on("requestfailed", (r) => console.log("FAILED", r.url(), r.failure()));
  await p.goto("http://localhost:3000");
  await p.waitForTimeout(3000);
  console.log(
    "SESSION",
    await p.evaluate(() => fetch("/api/session").then((r) => r.text())),
  );
  console.log("TEXT", (await p.locator("body").innerText()).slice(0, 3000));
  await p.screenshot({ path: "artifacts/debug.png", fullPage: true });
  await b.close();
})();

