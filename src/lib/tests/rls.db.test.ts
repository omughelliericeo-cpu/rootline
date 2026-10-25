// Proves row-level security: the app's database role can only see and change
// the current tenant's rows, and sees nothing at all without a tenant.
// Fixtures are written as the database owner (who bypasses RLS).
import { PrismaPg } from "@prisma/adapter-pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@/generated/prisma/client";
import { db, isStillReferenced, withTenant } from "../db";

const owner = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.TEST_DATABASE_URL! }) });

const userA = "00000000-0000-4000-8000-00000000000a";
const userB = "00000000-0000-4000-8000-00000000000b";
let brandA: string;
let brandB: string;

let productB: string;
let batchB: string;

beforeAll(async () => {
  await owner.shelfCode.deleteMany();
  await owner.batch.deleteMany();
  await owner.certificate.deleteMany();
  await owner.product.deleteMany();
  await owner.supplier.deleteMany();
  await owner.brandPerson.deleteMany();
  await owner.brand.deleteMany();
  brandA = (await owner.brand.create({ data: { ownerUserId: userA, industry: "brewery", name: "Brand A", location: "A" } })).id;
  brandB = (await owner.brand.create({ data: { ownerUserId: userB, industry: "bakery", name: "Brand B", location: "B" } })).id;
  await owner.brandPerson.create({ data: { brandId: brandB, name: "Bea", role: "Baker" } });
  const supplierB = await owner.supplier.create({
    data: { brandId: brandB, name: "Mill B", sourceType: "flour-mill", supplies: "Flour", address: "B", latitude: 49, longitude: -123 },
  });
  productB = (await owner.product.create({ data: { brandId: brandB, name: "Loaf", format: "800 g" } })).id;
  await owner.certificate.create({
    data: {
      brandId: brandB,
      productId: productB,
      claim: "organic",
      issuer: "Issuer",
      expiresOn: new Date("2030-01-01"),
      filePath: "b/certificate/x.pdf",
      fileName: "x.pdf",
      fileType: "application/pdf",
    },
  });
  batchB = (
    await owner.batch.create({
      data: {
        brandId: brandB,
        productId: productB,
        code: "b2c3d4e5",
        number: 1,
        madeAt: new Date(),
        lots: { create: [{ supplierId: supplierB.id, ingredient: "Flour", lotNumber: "M-1" }] },
        stops: { create: [{ position: 1, name: "Bakery B", type: "bakery" }] },
      },
    })
  ).id;
  await owner.shelfCode.create({ data: { brandId: brandB, code: "c3d4e5f6", label: "Counter", batchId: batchB } });
});

afterAll(async () => {
  await owner.$disconnect();
  await db().$disconnect();
});

describe("row-level security", () => {
  it("shows nothing without a tenant", async () => {
    expect(await db().brand.findMany()).toEqual([]);
    expect(await db().brandPerson.findMany()).toEqual([]);
  });

  it("shows a user only their own brand", async () => {
    const brands = await withTenant({ userId: userA }, (tx) => tx.brand.findMany());
    expect(brands.map((brand) => brand.name)).toEqual(["Brand A"]);
  });

  it("hides another brand's people", async () => {
    const people = await withTenant({ userId: userA, brandId: brandA }, (tx) => tx.brandPerson.findMany());
    expect(people).toEqual([]);
  });

  it("blocks adding a person to another brand", async () => {
    await expect(
      withTenant({ userId: userA, brandId: brandA }, (tx) =>
        tx.brandPerson.create({ data: { brandId: brandB, name: "Intruder", role: "None" } }),
      ),
    ).rejects.toThrow();
  });

  it("cannot change another brand", async () => {
    const result = await withTenant({ userId: userA, brandId: brandA }, (tx) =>
      tx.brand.updateMany({ where: { id: brandB }, data: { name: "Hacked" } }),
    );
    expect(result.count).toBe(0);
    expect((await owner.brand.findUniqueOrThrow({ where: { id: brandB } })).name).toBe("Brand B");
  });

  it("cannot create a brand for someone else", async () => {
    await expect(
      withTenant({ userId: userA }, (tx) =>
        tx.brand.create({ data: { ownerUserId: userB, industry: "brewery", name: "Fake", location: "X" } }),
      ),
    ).rejects.toThrow();
  });

  it("hides another brand's suppliers, products and certificates", async () => {
    const seen = await withTenant({ userId: userA, brandId: brandA }, async (tx) => ({
      suppliers: await tx.supplier.count(),
      products: await tx.product.count(),
      certificates: await tx.certificate.count(),
    }));
    expect(seen).toEqual({ suppliers: 0, products: 0, certificates: 0 });
  });

  it("sees its own suppliers, products and certificates", async () => {
    const seen = await withTenant({ userId: userB, brandId: brandB }, async (tx) => ({
      suppliers: await tx.supplier.count(),
      products: await tx.product.count(),
      certificates: await tx.certificate.count(),
    }));
    expect(seen).toEqual({ suppliers: 1, products: 1, certificates: 1 });
  });

  it("refuses to delete a product that still has certificates, with a recognisable error", async () => {
    const attempt = withTenant({ userId: userB, brandId: brandB }, (tx) => tx.product.delete({ where: { id: productB } }));
    const error = await attempt.catch((caught: unknown) => caught);
    expect(isStillReferenced(error)).toBe(true);
  });

  it("refuses a certificate that covers a product and a supplier at once", async () => {
    const supplier = await owner.supplier.findFirstOrThrow({ where: { brandId: brandB } });
    await expect(
      owner.certificate.create({
        data: {
          brandId: brandB,
          productId: productB,
          supplierId: supplier.id,
          claim: "organic",
          issuer: "Issuer",
          expiresOn: new Date("2030-01-01"),
          filePath: "b/certificate/y.pdf",
          fileName: "y.pdf",
          fileType: "application/pdf",
        },
      }),
    ).rejects.toThrow();
  });

  it("lets the owner work with their own rows", async () => {
    const created = await withTenant({ userId: userA, brandId: brandA }, (tx) =>
      tx.brandPerson.create({ data: { brandId: brandA, name: "Ada", role: "Head brewer" } }),
    );
    expect(created.name).toBe("Ada");
  });

  it("hides another brand's batches, lots, stops and shelf codes", async () => {
    const seen = await withTenant({ userId: userA, brandId: brandA }, async (tx) => ({
      batches: await tx.batch.count(),
      lots: await tx.batchLot.count(),
      stops: await tx.routeStop.count(),
      shelfCodes: await tx.shelfCode.count(),
    }));
    expect(seen).toEqual({ batches: 0, lots: 0, stops: 0, shelfCodes: 0 });
  });

  it("sees its own batch with its lots and stops", async () => {
    const seen = await withTenant({ userId: userB, brandId: brandB }, async (tx) => ({
      batches: await tx.batch.count(),
      lots: await tx.batchLot.count(),
      stops: await tx.routeStop.count(),
      shelfCodes: await tx.shelfCode.count(),
    }));
    expect(seen).toEqual({ batches: 1, lots: 1, stops: 1, shelfCodes: 1 });
  });

  it("blocks adding a stop to another brand's batch", async () => {
    await expect(
      withTenant({ userId: userA, brandId: brandA }, (tx) =>
        tx.routeStop.create({ data: { batchId: batchB, position: 2, name: "Intruder", type: "store" } }),
      ),
    ).rejects.toThrow();
  });

  it("refuses to delete a product that has batches", async () => {
    await owner.certificate.deleteMany({ where: { productId: productB } });
    const error = await withTenant({ userId: userB, brandId: brandB }, (tx) => tx.product.delete({ where: { id: productB } })).catch(
      (caught: unknown) => caught,
    );
    expect(isStillReferenced(error)).toBe(true);
  });

  // Runs last: it removes brand B.
  it("still deletes a whole brand with products, batches, lots and shelf codes", async () => {
    await owner.brand.delete({ where: { id: brandB } });
    expect(await owner.batch.count({ where: { brandId: brandB } })).toBe(0);
    expect(await owner.shelfCode.count({ where: { brandId: brandB } })).toBe(0);
  });
});
