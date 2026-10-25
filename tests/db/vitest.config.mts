// Vitest config for W4's tests: `npx vitest run --config tests/db/vitest.config.mts`
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const root = fileURLToPath(new URL("../..", import.meta.url));

export default defineConfig({
  root,
  resolve: { alias: { "@": `${root}src` } },
  test: { include: ["tests/db/**/*.test.ts"], environment: "node" },
});
