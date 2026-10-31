import { readFile, readdir, access } from "node:fs/promises";
import { resolve, dirname } from "node:path";
const problems = [];
const manifest = JSON.parse(
  await readFile("docs/features/manifest.json", "utf8"),
);
const slices = (await readdir("src/features", { withFileTypes: true }))
  .filter((e) => e.isDirectory())
  .map((e) => e.name);
const domain = await readFile("docs/BUSINESS_DOMAIN.md", "utf8");
const roadmap = await readFile("docs/ROADMAP.md", "utf8");
for (const slug of slices)
  if (manifest.filter((m) => m.slug === slug).length !== 1)
    problems.push(`${slug}: expected one feature card/manifest entry`);
for (const m of manifest) {
  if (!slices.includes(m.slug))
    problems.push(`${m.slug}: documented feature has no implementation`);
  if (!m.specification || !domain.includes(m.domain) || !roadmap.includes(m.id))
    problems.push(`${m.slug}: missing specification/domain/roadmap mapping`);
  for (const p of [m.document, m.publicApi, ...m.implementation])
    try {
      await access(p);
    } catch {
      problems.push(`${m.slug}: missing ${p}`);
    }
  let text = "";
  try {
    text = await readFile(m.document, "utf8");
  } catch {}
  for (const marker of [
    "Основание ТЗ",
    "Business Vision",
    "## Поведение",
    "## Инварианты",
    "## Реализация",
    "## Проверка и границы",
  ])
    if (!text.includes(marker))
      problems.push(`${m.document}: missing ${marker}`);
}
const docs = [
  "README.md",
  "docs/ARCHITECTURE.md",
  "docs/BUSINESS_DOMAIN.md",
  "docs/ROADMAP.md",
  "docs/P0_ACCEPTANCE.md",
  "docs/features/README.md",
  ...manifest.map((m) => m.document),
];
for (const doc of docs) {
  const text = await readFile(doc, "utf8");
  for (const match of text.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
    const href = match[1];
    if (/^(https?:|mailto:|#)/.test(href)) continue;
    const target = href.split("#")[0];
    if (!target) continue;
    try {
      await access(resolve(dirname(doc), decodeURIComponent(target)));
    } catch {
      problems.push(`${doc}: broken link ${href}`);
    }
  }
}
if (problems.length) {
  console.error(problems.join("\n"));
  process.exitCode = 1;
} else
  console.log(
    `Documentation sync: passed (${slices.length} feature cards, implementation links, domain/roadmap mappings).`,
  );
