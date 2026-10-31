import { defineConfig } from "@playwright/test";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
const cachedBrowser = join(
  homedir(),
  ".cache/ms-playwright/chromium-1243/chrome-linux64/chrome",
);
export default defineConfig({
  testDir: "./tests/browser",
  timeout: 60000,
  expect: { timeout: 15000 },
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: process.env.CITYCOM_BASE_URL || "http://localhost:3000",
    viewport: { width: 1440, height: 900 },
    headless: true,
    launchOptions: {
      executablePath:
        process.env.CHROMIUM_PATH ||
        (existsSync(cachedBrowser) ? cachedBrowser : undefined),
    },
  },
  reporter: "list",
});
