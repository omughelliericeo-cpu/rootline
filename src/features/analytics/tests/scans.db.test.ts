// Proves scans are counted on the right calendar day in the brand's time
// zone, whatever the database server's own time zone is.
import { PrismaPg } from "@prisma/adapter-pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@/generated/prisma/client";
import type { Owner } from "@/lib/auth";
import { db } from "@/lib/db";
import { scansByDay, topBatchesByScans } from "../server/queries";

const ownerDb = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.TEST_DATABASE_URL! }) });
const userId = "00000000-0000-4000-8000-0000000000ee";
let owner: Owner;
let batchId: string;

beforeAll(async () => {
  await ownerDb.brand.deleteMany({ where: { ownerUserId: userId } });
  const brand = await ownerDb.brand.create({ data: { ownerUserId: userId, industry: "brewery", name: "Scan Test", location: "Here" } });
  const product = await ownerDb.product.create({ data: { brandId: brand.id, name: "Ale", format: "can" } });
  batchId = (await ownerDb.batch.create({ data: { brandId: brand.id, productId: product.id, code: "scantst2", number: 7, status: "LIVE", madeAt: new Date() } })).id;
  owner = { userId, email: "", brandId: brand.id, brandName: "Scan Test", industry: "brewery", timezone: "America/Vancouver", billing: { plan: "GROWTH", trialEndsAt: null, subscriptionStatus: null, currentPeriodEnd: null } };
  await ownerDb.scanEvent.createMany({
    data: [
      // 11:30pm on Oct 24 in Vancouver (already Oct 25 in UTC): belongs to Oct 24.
      { batchId, scannedAt: new Date("2026-10-25T06:30:00Z") },
      // 8:00pm on Oct 24 in Vancouver.
      { batchId, scannedAt: new Date("2026-10-25T03:00:00Z") },
      // 12:30am on Oct 25 in Vancouver: belongs to Oct 25.
      { batchId, scannedAt: new Date("2026-10-25T07:30:00Z") },
      // Far outside the 14-day window.
      { batchId, scannedAt: new Date("2026-09-01T12:00:00Z") },
    ],
  });
});

afterAll(async () => {
  await ownerDb.brand.deleteMany({ where: { ownerUserId: userId } });
  await ownerDb.$disconnect();
  await db().$disconnect();
});

describe("scan counts", () => {
  it("counts each scan on its calendar day in the brand's zone", async () => {
    const now = new Date("2026-10-25T17:00:00Z"); // 10am Oct 25 in Vancouver
    const days = await scansByDay(owner, now, 14);
    expect(days).toHaveLength(14);
    expect(days.at(-1)).toEqual({ day: "2026-10-25", count: 1 });
    expect(days.at(-2)).toEqual({ day: "2026-10-24", count: 2 });
    expect(days.reduce((sum, day) => sum + day.count, 0)).toBe(3);
  });

  it("ranks batches by scans since a given moment", async () => {
    const top = await topBatchesByScans(owner, new Date("2026-10-20T00:00:00Z"), 5);
    expect(top).toEqual([{ batchId, productName: "Ale", number: 7, count: 3 }]);
  });

  it("starts the window at exactly the given moment, whatever the database's own time zone", async () => {
    // Only the 07:30 UTC scan is after 07:00 UTC. Reading the cut-off in the
    // session's time zone instead (a past bug) moved it hours and found none.
    const top = await topBatchesByScans(owner, new Date("2026-10-25T07:00:00Z"), 5);
    expect(top).toEqual([{ batchId, productName: "Ale", number: 7, count: 1 }]);
  });
});
