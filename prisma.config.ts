// Prisma CLI configuration (migrations, generate, seed).
// Migrations use DIRECT_URL (the database owner role, not a pooled connection);
// the running app connects with DATABASE_URL instead (see src/lib/db.ts).
import { defineConfig } from "prisma/config";

// Node's built-in .env loader; the file is optional (CI sets real env vars).
try {
  process.loadEnvFile(".env");
} catch {
  // No .env file: rely on the environment.
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.mts",
  },
  datasource: {
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "",
  },
});
