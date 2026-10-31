import { readdir, readFile, access } from "node:fs/promises";
import { resolve, relative, dirname } from "node:path";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { parse } = require("next/dist/compiled/babel/parser");
const root = resolve("src");
const ranks = {
  shared: 0,
  entities: 1,
  features: 2,
  widgets: 3,
  pages: 4,
  app: 5,
};
async function files(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  return (
    await Promise.all(
      entries.map((e) =>
        e.isDirectory() ? files(resolve(dir, e.name)) : [resolve(dir, e.name)],
      ),
    )
  ).flat();
}
const problems = [];
const classify = (file) => {
  const [layer, slice, ...segments] = relative(root, file).split("/");
  return { layer, slice, segments, rank: ranks[layer] };
};
for (const file of (await files(root)).filter((f) => /\.tsx?$/.test(f))) {
  const source = classify(file);
  if (source.rank === undefined) continue;
  const ast = parse(await readFile(file, "utf8"), {
    sourceType: "module",
    plugins: ["typescript", "jsx"],
  });
  function validate(spec, node) {
    if (
      ["@google/genai", "pdfkit"].includes(spec) ||
      spec.startsWith("node:")
    ) {
      problems.push(`${relative(root, file)}: server-only dependency ${spec}`);
      return;
    }
    if (!spec.startsWith("@/") && !spec.startsWith(".")) return;
    const targetFile = spec.startsWith("@/")
      ? resolve(root, spec.slice(2))
      : resolve(dirname(file), spec);
    const target = classify(targetFile);
    if (target.layer === "server") {
      problems.push(`${relative(root, file)}: frontend imports server ${spec}`);
      return;
    }
    if (target.rank === undefined) return;
    const sameSlice =
      source.layer === target.layer && source.slice === target.slice;
    if (
      sameSlice &&
      ["entities", "features", "widgets", "pages"].includes(source.layer) &&
      (!target.segments.length ||
        ["index", "index.ts", "client", "client.ts"].includes(
          target.segments.join("/"),
        ))
    ) {
      problems.push(
        `${relative(root, file)}: imports own public barrel ${spec}; use relative internals`,
      );
    }
    if (target.rank > source.rank)
      problems.push(`${relative(root, file)}: upward import ${spec}`);
    if (
      target.rank === source.rank &&
      !sameSlice &&
      !["shared", "app"].includes(source.layer)
    ) {
      const cross =
        source.layer === "entities" &&
        target.segments[0] === "@x" &&
        target.segments[1]?.replace(/\.ts$/, "") === source.slice;
      const typesOnly =
        node.importKind === "type" ||
        node.exportKind === "type" ||
        (node.specifiers?.length &&
          node.specifiers.every((s) => s.importKind === "type"));
      if (!cross || !typesOnly)
        problems.push(
          `${relative(root, file)}: same-layer slice import ${spec}`,
        );
    }
    if (
      !sameSlice &&
      ["entities", "features", "widgets", "pages"].includes(target.layer)
    ) {
      const tail = target.segments.join("/");
      const publicAPI =
        !tail || ["index", "index.ts", "client", "client.ts"].includes(tail);
      const cross =
        source.layer === "entities" &&
        target.segments[0] === "@x" &&
        target.segments[1]?.replace(/\.ts$/, "") === source.slice;
      if (!publicAPI && !cross)
        problems.push(`${relative(root, file)}: bypasses public API ${spec}`);
    }
  }
  function walk(n) {
    if (!n || typeof n !== "object") return;
    if (
      [
        "ImportDeclaration",
        "ExportNamedDeclaration",
        "ExportAllDeclaration",
      ].includes(n.type) &&
      n.source
    )
      validate(n.source.value, n);
    if (
      n.type === "CallExpression" &&
      n.callee?.type === "Import" &&
      n.arguments[0]?.type === "StringLiteral"
    )
      validate(n.arguments[0].value, n);
    for (const [k, v] of Object.entries(n)) {
      if (["loc", "start", "end", "comments", "tokens"].includes(k)) continue;
      if (Array.isArray(v)) v.forEach(walk);
      else if (v && typeof v === "object") walk(v);
    }
  }
  walk(ast.program);
}
for (const layer of ["entities", "features", "widgets", "pages"])
  for (const e of await readdir(resolve(root, layer), {
    withFileTypes: true,
  })) {
    if (!e.isDirectory()) continue;
    try {
      await access(resolve(root, layer, e.name, "index.ts"));
    } catch {
      problems.push(`${layer}/${e.name}: missing public index.ts`);
    }
  }
if (problems.length) {
  console.error(problems.join("\n"));
  process.exitCode = 1;
} else
  console.log(
    "FSD boundaries: passed (layers, public APIs, explicit type-only @x, server isolation).",
  );
