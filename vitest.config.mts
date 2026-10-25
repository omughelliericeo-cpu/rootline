// Vitest runs the fast unit tests: every *.test.ts under src/ (business rules
// in service.ts files, lib helpers). Browser journeys use Playwright instead.
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      // "server-only" throws outside a React Server Components build; in tests it is a no-op.
      "server-only": fileURLToPath(new URL("./src/lib/tests/server-only-stub.ts", import.meta.url)),
    },
  },
  test: {
    include: ["src/**/*.test.ts"],
    // *.db.test.ts need a real Postgres; they run with `npm run test:db` (vitest.db.config.mts).
    exclude: ["**/node_modules/**", "src/**/*.db.test.ts"],
    environment: "node",
    env: { LOG_LEVEL: "silent" },
  },
});
