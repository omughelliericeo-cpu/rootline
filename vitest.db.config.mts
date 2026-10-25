// Vitest config for database tests (*.db.test.ts): row-level security and
// other rules that only a real Postgres can prove. They run against a
// separate test database, migrated before the run (tests/db-setup.ts).
//   npm run test:db
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const OWNER_URL = process.env.TEST_DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/rootline_test";
const APP_URL = process.env.TEST_APP_DATABASE_URL ?? "postgresql://rootline_app:rootline_app_dev@localhost:5432/rootline_test";

// Global setup runs in the main process, which does not get `test.env` below.
process.env.TEST_DATABASE_URL = OWNER_URL;

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "server-only": fileURLToPath(new URL("./src/lib/tests/server-only-stub.ts", import.meta.url)),
    },
  },
  test: {
    include: ["src/**/*.db.test.ts"],
    environment: "node",
    globalSetup: ["tests/db-setup.ts"],
    fileParallelism: false,
    env: {
      LOG_LEVEL: "silent",
      // The app code under test connects as the restricted role...
      DATABASE_URL: APP_URL,
      // ...while setup and test fixtures use the owner.
      DIRECT_URL: OWNER_URL,
      TEST_DATABASE_URL: OWNER_URL,
    },
  },
});
