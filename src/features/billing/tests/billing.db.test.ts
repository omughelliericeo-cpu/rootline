// Proves the billing rules in the database: the app cannot change a brand's
// plan or billing columns itself (not even its own), only apply_subscription()
// can, and it changes nothing else.
import { PrismaPg } from "@prisma/adapter-pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@/generated/prisma/client";
import { db, withTenant } from "@/lib/db";

const owner = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.TEST_DATABASE_URL! }) });
const userId = "00000000-0000-4000-8000-0000000000f1";
let brandId = "";

beforeAll(async () => {
  await owner.brand.deleteMany({ where: { ownerUserId: userId } });
  brandId = (await owner.brand.create({ data: { ownerUserId: userId, industry: "brewery", name: "Billing Test Brewing", location: "Here" } })).id;
});

afterAll(async () => {
  await owner.brand.deleteMany({ where: { id: brandId } });
  await owner.stripeEvent.deleteMany({ where: { id: { startsWith: "evt_test_" } } });
  await owner.$disconnect();
});

describe("billing columns", () => {
  it("cannot be changed by the app, even for the owner's own brand", async () => {
    const attempt = withTenant({ userId, brandId }, (tx) => tx.brand.update({ where: { id: brandId }, data: { plan: "ENTERPRISE" } }));
    await expect(attempt).rejects.toThrow();
    expect((await owner.brand.findUniqueOrThrow({ where: { id: brandId } })).plan).toBe("STARTER");
  });

  it("still lets the owner edit their profile", async () => {
    await withTenant({ userId, brandId }, (tx) => tx.brand.update({ where: { id: brandId }, data: { quote: "Hello" } }));
    expect((await owner.brand.findUniqueOrThrow({ where: { id: brandId } })).quote).toBe("Hello");
  });

  it("are set by apply_subscription, which changes nothing else", async () => {
    const periodEnd = new Date("2026-12-01T00:00:00Z");
    const [{ ok }] = await db().$queryRaw<Array<{ ok: boolean }>>`
      SELECT apply_subscription(${brandId}::uuid, 'GROWTH'::"Plan", 'cus_test', 'sub_test', 'active', 'month', ${periodEnd}::timestamp) AS ok`;
    expect(ok).toBe(true);
    const brand = await owner.brand.findUniqueOrThrow({ where: { id: brandId } });
    expect(brand).toMatchObject({ plan: "GROWTH", stripeCustomerId: "cus_test", stripeSubscriptionId: "sub_test", subscriptionStatus: "active", billingInterval: "month", name: "Billing Test Brewing", quote: "Hello" });
    expect(brand.currentPeriodEnd?.toISOString()).toBe(periodEnd.toISOString());
  });

  it("reports an unknown brand instead of failing", async () => {
    const [{ ok }] = await db().$queryRaw<Array<{ ok: boolean }>>`
      SELECT apply_subscription('00000000-0000-4000-8000-00000000dead'::uuid, 'GROWTH'::"Plan", 'c', 's', 'active', 'month', NULL) AS ok`;
    expect(ok).toBe(false);
  });
});

describe("stripe events", () => {
  it("are recorded once; a repeat is recognised", async () => {
    const claim = async () => (await db().$queryRaw<Array<{ fresh: boolean }>>`SELECT stripe_event_claim('evt_test_1', 'customer.subscription.updated') AS fresh`)[0]!.fresh;
    expect(await claim()).toBe(true);
    expect(await claim()).toBe(false);
  });

  it("cannot be read or written directly by the app", async () => {
    expect(await db().stripeEvent.count()).toBe(0);
    await expect(db().stripeEvent.create({ data: { id: "evt_test_direct", type: "x" } })).rejects.toThrow();
  });
});
