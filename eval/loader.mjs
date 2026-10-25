// Resolve hook: "@/x" → src/x, extensionless relative imports → .ts / index.ts, JSON as a default export.
import { readFileSync, statSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";

const SRC = new URL("../src/", import.meta.url);

function tryFile(url) {
  const p = fileURLToPath(url);
  for (const cand of [p, `${p}.ts`, `${p}/index.ts`]) {
    if (statSync(cand, { throwIfNoEntry: false })?.isFile()) return pathToFileURL(cand).href;
  }
  return null;
}

export async function resolve(specifier, context, next) {
  if (specifier.startsWith("@/")) {
    const hit = tryFile(new URL(specifier.slice(2), SRC));
    if (hit) return { url: hit, shortCircuit: true };
  }
  if ((specifier.startsWith("./") || specifier.startsWith("../")) && context.parentURL?.startsWith("file:")) {
    const hit = tryFile(new URL(specifier, context.parentURL));
    if (hit) return { url: hit, shortCircuit: true };
  }
  return next(specifier, context);
}

export async function load(url, context, next) {
  if (url.endsWith(".json")) {
    const text = readFileSync(fileURLToPath(url), "utf8");
    return { format: "module", source: `export default ${text};`, shortCircuit: true };
  }
  if (url.endsWith(".ts")) return next(url, { ...context, format: "module-typescript" });
  return next(url, context);
}
