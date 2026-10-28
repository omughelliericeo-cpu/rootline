// Proves the database rules for shopper photos: the public can only add
// waiting photos to published batches (and only up to 50 waiting), can only
// see approved ones, and one brand never sees another brand's photos.
import { PrismaPg } from "@prisma/adapter-pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@/generated/prisma/client";
import { isPolicyViolation, withPublic, withTenant } from "@/lib/db";

const owner = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.TEST_DATABASE_URL! }) });
const users = { a: "00000000-0000-4000-8000-0000000000e1", b: "00000000-0000-4000-8000-0000000000e2" };
const ids = { brandA: "", brandB: "", live: "", draft: "", liveB: "" };

const photo = (batchId: string, brandId: string, extra: Record<string, unknown> = {}) => ({
  batchId,
  brandId,
  photoPath: `${brandId}/shopper/${crypto.randomUUID()}.jpg`,
  consentText: "I took this photo",
  ...extra,
});

beforeAll(async () => {
  await owner.brand.deleteMany({ where: { name: { in: ["Photo Brewing A", "Photo Roastery B"] } } });
  const create = async (name: string, userId: string, industry: string, codes: Array<[string, "LIVE" | "DRAFT"]>) => {
    const brand = await owner.brand.create({ data: { ownerUserId: userId, industry, name, location: "Here" } });
    const product = await owner.product.create({ data: { brandId: brand.id, name: `${name} product`, format: "can" } });
    const batches = [];
    for (const [index, [code, status]] of codes.entries()) {
      batches.push((await owner.batch.create({ data: { brandId: brand.id, productId: product.id, code, number: index + 1, status, madeAt: new Date() } })).id);
    }
    return { brand: brand.id, batches };
  };
  const a = await create("Photo Brewing A", users.a, "brewery", [["phot2a2b", "LIVE"], ["phot2d2r", "DRAFT"]]);
  const b = await create("Photo Roastery B", users.b, "coffee", [["phot2b2b", "LIVE"]]);
  Object.assign(ids, { brandA: a.brand, live: a.batches[0], draft: a.batches[1], brandB: b.brand, liveB: b.batches[0] });
});

afterAll(async () => {
  await owner.brand.deleteMany({ where: { id: { in: [ids.brandA, ids.brandB] } } });
  await owner.$disconnect();
});

const publicInsert = (data: ReturnType<typeof photo>) => withPublic((tx) => tx.shopperPhoto.createMany({ data: [data] }));

describe("public (story page)", () => {
  it("can add a waiting photo to a published batch, but not read it back", async () => {
    await publicInsert(photo(ids.live, ids.brandA, { note: "Lovely" }));
    expect(await owner.shopperPhoto.count({ where: { batchId: ids.live, status: "PENDING" } })).toBe(1);
    expect(await withPublic((tx) => tx.shopperPhoto.count())).toBe(0);
  });

  it("cannot add to a draft, mark its own photo approved, or file it under another brand", async () => {
    for (const data of [
      photo(ids.draft, ids.brandA),
      photo(ids.live, ids.brandA, { status: "APPROVED" }),
      photo(ids.live, ids.brandB),
    ]) {
      const error = await publicInsert(data).catch((caught: unknown) => caught);
      expect(isPolicyViolation(error)).toBe(true);
    }
  });

  it("sees approved photos of published batches only", async () => {
    await owner.shopperPhoto.create({ data: photo(ids.live, ids.brandA, { status: "APPROVED", approvedAt: new Date(), note: "Shown" }) });
    await owner.shopperPhoto.create({ data: photo(ids.draft, ids.brandA, { status: "APPROVED", approvedAt: new Date(), note: "Draft batch" }) });
    const visible = await withPublic((tx) => tx.shopperPhoto.findMany({ select: { note: true } }));
    expect(visible).toEqual([{ note: "Shown" }]);
  });

  it("is refused once 50 photos are waiting on a batch", async () => {
    const waiting = await owner.shopperPhoto.count({ where: { batchId: ids.live, status: "PENDING" } });
    await owner.shopperPhoto.createMany({ data: Array.from({ length: 50 - waiting }, () => photo(ids.live, ids.brandA)) });
    const error = await publicInsert(photo(ids.live, ids.brandA)).catch((caught: unknown) => caught);
    expect(isPolicyViolation(error)).toBe(true);
    await owner.shopperPhoto.deleteMany({ where: { batchId: ids.live, status: "PENDING", note: null } });
  });
});

describe("producers", () => {
  it("see and moderate only their own brand's photos", async () => {
    await owner.shopperPhoto.create({ data: photo(ids.liveB, ids.brandB, { note: "Roastery photo" }) });
    const asA = await withTenant({ userId: users.a, brandId: ids.brandA }, (tx) => tx.shopperPhoto.findMany({ select: { brandId: true } }));
    expect(asA.length).toBeGreaterThan(0);
    expect(asA.every((row) => row.brandId === ids.brandA)).toBe(true);

    const deleted = await withTenant({ userId: users.a, brandId: ids.brandA }, (tx) => tx.shopperPhoto.deleteMany({ where: { brandId: ids.brandB } }));
    expect(deleted.count).toBe(0);
    expect(await owner.shopperPhoto.count({ where: { brandId: ids.brandB } })).toBe(1);
  });
});
