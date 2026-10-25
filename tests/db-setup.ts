// Runs once before the database tests: applies any pending migrations to the
// test database (as the owner), so it always matches prisma/schema.prisma.
// `migrate deploy` never drops data; the tests clean up their own rows.
import { execSync } from "node:child_process";

export default function setup() {
  const url = process.env.TEST_DATABASE_URL ?? "";
  if (!/\/rootline_test(\?|$)/.test(url)) {
    throw new Error(`Refusing to run database tests against "${url}": the database name must be rootline_test.`);
  }
  execSync("npx prisma migrate deploy", { stdio: "inherit", env: { ...process.env, DIRECT_URL: url, DATABASE_URL: url } });
}
