// Demo data: one published demo brand for every industry, so each kind of
// story page and dashboard can be seen. Cedar & Tide (brewery, /b/cedarpm2)
// is the main demo. Safe to run again: each brand's previous demo is removed
// first. Runs as the database owner (DIRECT_URL), so row-level security does
// not apply.
//   npm run db:seed
// The brands are described in prisma/seed/brands-*.mts and built by
// prisma/seed/build.mts.
import { PrismaPg } from "@prisma/adapter-pg";
import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "../src/generated/prisma/client";
import { blackbirdRidge, cedarAndTide, ridgelineRoasters } from "./seed/brands-drinks.mjs";
import { briarCreek, dawnRise, sunfield } from "./seed/brands-food.mjs";
import { seedBrand } from "./seed/build.mjs";

try {
  process.loadEnvFile(".env");
} catch {
  // Environment variables come from the shell instead.
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL! }) });
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });

async function main() {
  console.log("Seeded demo brands (story page, login):");
  for (const brand of [cedarAndTide, blackbirdRidge, ridgelineRoasters, dawnRise, briarCreek, sunfield]) {
    await seedBrand(prisma, supabase, brand);
  }
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
