// Node module hooks so scripts can import the app's TypeScript (node >= 22.18 strips types):
// resolves extensionless relative imports and the "@/..." alias to .ts files under src/.
import { existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { resolve as resolvePath } from "node:path";

const SRC = resolvePath(fileURLToPath(new URL("../../src/", import.meta.url)));

export async function resolve(specifier, context, next) {
  let spec = specifier;
  if (spec.startsWith("@/")) spec = pathToFileURL(resolvePath(SRC, spec.slice(2))).href;
  if ((spec.startsWith(".") || spec.startsWith("file:")) && !/\.[cm]?[jt]s$/.test(spec)) {
    const base = spec.startsWith("file:") ? spec : new URL(spec, context.parentURL).href;
    for (const ext of [".ts", "/index.ts"]) {
      if (existsSync(fileURLToPath(base + ext))) return next(base + ext, context);
    }
  }
  return next(spec, context);
}
