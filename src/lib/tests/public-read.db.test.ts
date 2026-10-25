// Proves what public story pages can see (withPublic): only published batches
// and what their story shows. Drafts, unpublished products, invalid
// certificates and scan counts stay private, and nothing can be changed.
import { PrismaPg } from "@prisma/adapter-pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@/generated/prisma/client";
import { db, withPublic } from "../db";

const owner = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.TEST_DATABASE_URL! }) });
const ids = { brand: "", liveBatch: "", draftBatch: "", publishedProduct: "", hiddenProduct: "" };

beforeAll(async () => {
  await owner.brand.deleteMany({ where: { name: "Public Test Brewing" } });
  const brand = await owner.brand.create({
    data: { ownerUserId: "00000000-0000-4000-8000-0000000000dd", industry: "brewery", name: "Public Test Brewing", location: "Here" },
  });
  ids.brand = brand.id;
  const supplier = await owner.supplier.create({
    data: { brandId: brand.id, name: "Farm", sourceType: "maltster", supplies: "Malt", address: "There", latitude: 50, longitude: -120 },
  });
  const [published, hidden] = await Promise.all([
    owner.product.create({ data: { brandId: brand.id, name: "Published Ale", format: "can" } }),
    owner.product.create({ data: { brandId: brand.id, name: "Secret Recipe", format: "can" } }),
  ]);
  ids.publishedProduct = published.id;
  ids.hiddenProduct = hidden.id;
  const lotsAndStops = {
    lots: { create: [{ supplierId: supplier.id, ingredient: "Malt", lotNumber: "L1" }] },
    stops: { create: [{ position: 1, name: "Brewery", type: "brewery" }] },
  };
  ids.liveBatch = (await owner.batch.create({ data: { brandId: brand.id, productId: published.id, code: "pubtest2", number: 1, status: "LIVE", madeAt: new Date(), ...lotsAndStops } })).id;
  ids.draftBatch = (await owner.batch.create({ data: { brandId: brand.id, productId: hidden.id, code: "pubtest3", number: 1, status: "DRAFT", madeAt: new Date(), ...lotsAndStops } })).id;
  const certificate = { brandId: brand.id, issuer: "Issuer", filePath: "x.pdf", fileName: "x.pdf", fileType: "application/pdf" };
  await owner.certificate.createMany({
    data: [
      { ...certificate, claim: "b-corp", expiresOn: new Date("2030-01-01") },
      { ...certificate, claim: "organic", expiresOn: new Date("2030-01-01"), status: "REVOKED" },
      { ...certificate, claim: "local-hops", expiresOn: new Date("2020-01-01") },
    ],
  });
  await owner.shelfCode.createMany({
    data: [
      { brandId: brand.id, code: "shelfok2", label: "Tap 1", batchId: ids.liveBatch },
      { brandId: brand.id, code: "shelfdr2", label: "Tap 2", batchId: ids.draftBatch },
    ],
  });
});

afterAll(async () => {
  await owner.brand.deleteMany({ where: { id: ids.brand } });
  await owner.$disconnect();
  await db().$disconnect();
});

describe("public story page access", () => {
  it("sees published batches but never drafts", async () => {
    const codes = await withPublic((tx) => tx.batch.findMany({ where: { brandId: ids.brand }, select: { code: true } }));
    expect(codes).toEqual([{ code: "pubtest2" }]);
  });

  it("sees the brand and the published product, not unpublished products", async () => {
    const seen = await withPublic(async (tx) => ({
      brands: await tx.brand.count({ where: { id: ids.brand } }),
      products: (await tx.product.findMany({ where: { brandId: ids.brand }, select: { name: true } })).map((p) => p.name),
    }));
    expect(seen).toEqual({ brands: 1, products: ["Published Ale"] });
  });

  it("sees lots and stops of the published batch only", async () => {
    const seen = await withPublic(async (tx) => ({
      lots: await tx.batchLot.count({ where: { batchId: { in: [ids.liveBatch, ids.draftBatch] } } }),
      stops: await tx.routeStop.count({ where: { batchId: { in: [ids.liveBatch, ids.draftBatch] } } }),
    }));
    expect(seen).toEqual({ lots: 1, stops: 1 });
  });

  it("sees only valid certificates", async () => {
    const claims = await withPublic((tx) => tx.certificate.findMany({ where: { brandId: ids.brand }, select: { claim: true } }));
    expect(claims).toEqual([{ claim: "b-corp" }]);
  });

  it("finds shelf codes only when they point at a published batch", async () => {
    const codes = await withPublic((tx) => tx.shelfCode.findMany({ where: { brandId: ids.brand }, select: { code: true } }));
    expect(codes).toEqual([{ code: "shelfok2" }]);
  });

  it("may add a scan of a published batch, but not of a draft", async () => {
    // createMany is what the app uses: the public may write scans but never read them back.
    await withPublic((tx) => tx.scanEvent.createMany({ data: [{ batchId: ids.liveBatch }] }));
    await expect(withPublic((tx) => tx.scanEvent.createMany({ data: [{ batchId: ids.draftBatch }] }))).rejects.toThrow();
  });

  it("cannot read scan counts", async () => {
    expect(await withPublic((tx) => tx.scanEvent.count())).toBe(0);
    expect(await owner.scanEvent.count({ where: { batchId: ids.liveBatch } })).toBe(1);
  });

  it("cannot change anything", async () => {
    const result = await withPublic((tx) => tx.batch.updateMany({ where: { id: ids.liveBatch }, data: { number: 999 } }));
    expect(result.count).toBe(0);
    await expect(
      withPublic((tx) => tx.brandPerson.create({ data: { brandId: ids.brand, name: "Intruder", role: "None" } })),
    ).rejects.toThrow();
  });

  it("sees nothing at all outside public mode or a tenant", async () => {
    expect(await db().batch.count({ where: { brandId: ids.brand } })).toBe(0);
  });
});
