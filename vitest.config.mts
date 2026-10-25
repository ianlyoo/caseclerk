// Root vitest config: `npx vitest run` runs every suite (live PayPal tests stay gated by PAYPAL_LIVE_TESTS=1).
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const root = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  resolve: { alias: { "@": `${root}src` } },
  test: { include: ["tests/**/*.test.ts"], environment: "node" },
});
