/** Limited read-only source check. No Gemini calls, no LIVE database writes. */
import { mkdir, writeFile } from "node:fs/promises";
import { parsePublicHtml } from "../src/server/public-html";
import { matchesKeywords } from "../src/server/source-contract";
async function main() {
  const keywords = "жкх,отопл,тепло,электро,водоснабж,мусор,жиль,тұрғын";
  const candidates = [
    {
      name: "ПАВЛОДАРЭНЕРГО",
      url: "https://pavlodarenergo.kz/ru/blog-rukovoditelya/obrashhenie.html",
      parser: "HTML: обращение отдельно от ответа",
      city: "Павлодар",
    },
    {
      name: "Открытый диалог",
      url: "https://dialog.egov.kz/blogs/all-questions/766288",
      parser: "HTML: полная карточка обращения",
      city: "Казахстан; географию проверять отдельно",
    },
  ];
  const parsed = await Promise.all(
    candidates.map(async (source) => {
      try {
        const response = await fetch(source.url, {
          redirect: "error",
          signal: AbortSignal.timeout(15000),
        });
        if (!response.ok)
          return { ...source, status: response.status, ok: false };
        const raw = await response.text();
        const rows = parsePublicHtml(raw, source.url) || [];
        return {
          ...source,
          status: response.status,
          ok: rows.length > 0,
          records: rows.length,
          keywordMatches: rows.filter((row) =>
            matchesKeywords(row.text, keywords),
          ).length,
          dates: rows.map((row) => ({
            publishedAt: row.publishedAt,
            precision: row.publishedAtPrecision,
          })),
          missingDates: rows.filter((row) => !row.publishedAt).length,
          note: "Только проверка извлечения. Нет согласования регулярного сбора/передачи в AI; не записано в LIVE.",
        };
      } catch {
        return {
          ...source,
          ok: false,
          error: "Ошибка загрузки/разбора; проверьте доступность и разметку",
        };
      }
    }),
  );
  const anonymousEndpoints = [
    {
      name: "VK wall.get без токена",
      url: "https://api.vk.com/method/wall.get?domain=tipavlo&count=1&v=5.199",
    },
    {
      name: "Instagram Graph без токена",
      url: "https://graph.instagram.com/me?fields=id",
    },
    {
      name: "Facebook Graph без токена",
      url: "https://graph.facebook.com/me?fields=id",
    },
  ];
  const anonymous = await Promise.all(
    anonymousEndpoints.map(async (source) => {
      try {
        const response = await fetch(source.url, {
          redirect: "error",
          signal: AbortSignal.timeout(15000),
        });
        const body = (await response.json()) as {
          error?: { error_code?: number; code?: number };
          response?: unknown;
        };
        return {
          name: source.name,
          status: response.status,
          apiErrorCode: body.error?.error_code ?? body.error?.code,
          dataReturned: Boolean(body.response),
          note: "Один запрос без токена. Никаких обходов/повторных попыток.",
        };
      } catch {
        return {
          name: source.name,
          error: "Недоступен/не-JSON ответ; анонимный доступ не подтверждён",
        };
      }
    }),
  );
  const result = {
    checkedAt: new Date().toISOString(),
    keywords,
    parsed,
    anonymous,
    geminiCalled: false,
    liveDatabaseWritten: false,
  };
  await mkdir("artifacts", { recursive: true });
  await writeFile(
    "artifacts/source-probe.json",
    JSON.stringify(result, null, 2) + "\n",
  );
  console.log(JSON.stringify(result, null, 2));
  if (parsed.some((source) => !source.ok)) process.exitCode = 1;
}
void main().catch(() => {
  console.error("Проверка источников завершилась ошибкой");
  process.exitCode = 1;
});
