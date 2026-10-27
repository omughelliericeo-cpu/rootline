// Sets a brand's plan by hand, e.g. for an Enterprise contract or support.
// Runs as the database owner (DIRECT_URL). Clears any trial, so the plan
// applies until changed again; Stripe subscriptions still update it.
//   npm run plan:set -- owner@brewery.ca growth
import { PrismaPg } from "@prisma/adapter-pg";
import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "../src/generated/prisma/client";

const PLANS = ["starter", "growth", "enterprise"];

async function main() {
  const [email, planArg] = process.argv.slice(2);
  if (!email || !planArg || !PLANS.includes(planArg.toLowerCase())) throw new Error("Usage: npm run plan:set -- <owner email> starter|growth|enterprise");
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
  const { data, error } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (error) throw error;
  const user = data.users.find((candidate) => candidate.email?.toLowerCase() === email.toLowerCase());
  if (!user) throw new Error(`No account with the email ${email}`);

  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DIRECT_URL! }) });
  try {
    const plan = planArg.toUpperCase() as "STARTER" | "GROWTH" | "ENTERPRISE";
    const brand = await prisma.brand.update({ where: { ownerUserId: user.id }, data: { plan, trialEndsAt: null }, select: { name: true, plan: true } });
    console.log(`${brand.name} is now on ${brand.plan}.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
