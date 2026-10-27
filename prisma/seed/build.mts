// Builds one demo brand from a DemoBrand description: its owner login, brand,
// people, suppliers, product (with the industry photo), certificates, one
// published batch with lots and journey stops, demo scans and recall sign-ups.
// Safe to run again: the brand's previous demo data is removed first.
import { readFile } from "node:fs/promises";
import type { SupabaseClient } from "@supabase/supabase-js";
import { PDFDocument, StandardFonts } from "pdf-lib";
import type { PrismaClient } from "../../src/generated/prisma/client";
import { dateKeyIn, zonedDateTime } from "../../src/lib/dates";

type Place = { address: string; latitude: number; longitude: number };

export type DemoBrand = {
  email: string;
  password: string;
  industry: string;
  name: string;
  location: Place;
  quote: string;
  people: Array<{ name: string; role: string }>;
  suppliers: Array<Place & { key: string; name: string; sourceType: string; supplies: string }>;
  product: { name: string; format: string; ingredients: string[]; allergens: string[]; dietaryTags: string[]; extra: Record<string, unknown> };
  /** claim id, issuer, days until expiry, and whether it covers only the product. */
  certificates: Array<{ claim: string; issuer: string; expiresInDays: number; productOnly?: boolean }>;
  batch: {
    code: string;
    number: number;
    madeDaysAgo: number;
    /** Wall-clock time the batch was made, for templates that show it ("Baked at 5am today"). */
    madeTime?: string;
    packagedDaysAgo: number | null;
    extra?: Record<string, unknown>;
    lots: Array<{ supplier: string; ingredient: string; lotNumber: string }>;
    stops: Array<Place & { name: string; type: string; daysAgo: number; note?: string }>;
  };
  /** Rough number of demo scans per day at the busiest point. */
  scansPerDay: number;
};

const TIME_ZONE = "America/Vancouver";
const DAY = 86_400_000;
const daysAgo = (days: number) => new Date(Date.now() - days * DAY);
/** A @db.Date value N days ago. */
const dateDaysAgo = (days: number) => new Date(`${daysAgo(days).toISOString().slice(0, 10)}T00:00:00Z`);

async function ownerUserId(supabase: SupabaseClient, email: string, password: string): Promise<string> {
  const created = await supabase.auth.admin.createUser({ email, password, email_confirm: true });
  if (created.data.user) return created.data.user.id;
  const { data, error } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (error) throw error;
  const existing = data.users.find((user) => user.email === email);
  if (!existing) throw created.error ?? new Error(`Could not create ${email}`);
  await supabase.auth.admin.updateUserById(existing.id, { password });
  return existing.id;
}

async function certificatePdf(brandName: string, claim: string): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595, 842]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  page.drawText(`DEMO CERTIFICATE - ${claim} - ${brandName}`, { x: 50, y: 780, size: 12, font });
  page.drawText("Sample file for the Rootline demo. Not a real certificate.", { x: 50, y: 760, size: 10, font });
  return pdf.save();
}

async function upload(supabase: SupabaseClient, bucket: string, path: string, body: Uint8Array, contentType: string) {
  const { error } = await supabase.storage.from(bucket).upload(path, body, { contentType, upsert: true });
  if (error) throw error;
}

function madeAt(spec: DemoBrand["batch"]): Date {
  if (!spec.madeTime) return daysAgo(spec.madeDaysAgo);
  return zonedDateTime(dateKeyIn(daysAgo(spec.madeDaysAgo), TIME_ZONE), spec.madeTime, TIME_ZONE);
}

export async function seedBrand(prisma: PrismaClient, supabase: SupabaseClient, spec: DemoBrand): Promise<void> {
  const userId = await ownerUserId(supabase, spec.email, spec.password);
  await prisma.brand.deleteMany({ where: { ownerUserId: userId } });
  await prisma.batch.deleteMany({ where: { code: spec.batch.code } });

  const brand = await prisma.brand.create({
    data: {
      ownerUserId: userId,
      industry: spec.industry,
      name: spec.name,
      location: spec.location.address,
      latitude: spec.location.latitude,
      longitude: spec.location.longitude,
      quote: spec.quote,
      people: { create: spec.people.map((person, position) => ({ ...person, position })) },
    },
  });

  const suppliers = new Map<string, string>();
  for (const { key, ...supplier } of spec.suppliers) {
    suppliers.set(key, (await prisma.supplier.create({ data: { brandId: brand.id, ...supplier } })).id);
  }

  // The industry's general photo doubles as the demo product photo (story banner and share preview).
  const photoPath = `${brand.id}/product/demo-${spec.industry}.jpg`;
  await upload(supabase, "brand-media", photoPath, await readFile(`public/photos/industries/${spec.industry}.jpg`), "image/jpeg");
  const product = await prisma.product.create({ data: { brandId: brand.id, ...spec.product, extra: spec.product.extra as object, photoPath } });

  for (const cert of spec.certificates) {
    const filePath = `${brand.id}/certificate/demo-${cert.claim}.pdf`;
    await upload(supabase, "certificates", filePath, await certificatePdf(spec.name, cert.claim), "application/pdf");
    await prisma.certificate.create({
      data: {
        brandId: brand.id,
        productId: cert.productOnly ? product.id : null,
        claim: cert.claim,
        issuer: cert.issuer,
        expiresOn: dateDaysAgo(-cert.expiresInDays),
        filePath,
        fileName: `${cert.claim}-certificate.pdf`,
        fileType: "application/pdf",
      },
    });
  }

  const { batch: b } = spec;
  const batch = await prisma.batch.create({
    data: {
      brandId: brand.id,
      productId: product.id,
      code: b.code,
      number: b.number,
      status: "LIVE",
      madeAt: madeAt(b),
      packagedAt: b.packagedDaysAgo === null ? null : daysAgo(b.packagedDaysAgo),
      publishedAt: daysAgo(Math.min(b.madeDaysAgo, b.packagedDaysAgo ?? b.madeDaysAgo)),
      extra: (b.extra ?? {}) as object,
      lots: { create: b.lots.map((lot, position) => ({ supplierId: suppliers.get(lot.supplier)!, ingredient: lot.ingredient, lotNumber: lot.lotNumber, position })) },
      stops: {
        create: b.stops.map(({ daysAgo: ago, ...stop }, index) => ({ ...stop, position: index + 1, arrivedOn: dateDaysAgo(ago) })),
      },
    },
  });

  // Demo scans over the last 14 days (busier recently) and a few recall sign-ups.
  const towns = [spec.location.address.split(",")[0]!, "Vancouver", "Victoria", "Kelowna"];
  const scans = Array.from({ length: 14 }, (_, day) =>
    Array.from({ length: Math.max(1, Math.round(spec.scansPerDay * (1 - day / 18))) }, (_, n) => ({
      batchId: batch.id,
      via: n % 4 === 0 ? ("SHELF" as const) : ("BATCH" as const),
      scannedAt: new Date(Date.now() - day * DAY - n * 1_700_000),
      country: "CA",
      region: "BC",
      city: towns[n % towns.length],
    })),
  ).flat();
  await prisma.scanEvent.createMany({ data: scans });
  const slug = spec.email.split("@")[1]!.split(".")[0];
  await prisma.recallSubscriber.createMany({
    data: [1, 2].map((n) => ({
      batchId: batch.id,
      email: `demo.shopper${n}+${slug}@example.com`,
      consentText: "Email me only if this batch is recalled. My email is not shared or used for anything else, and I can unsubscribe at any time.",
      consentAt: daysAgo(n * 3),
      unsubscribeToken: Array.from(crypto.getRandomValues(new Uint8Array(24)), (byte) => byte.toString(16).padStart(2, "0")).join(""),
    })),
  });

  console.log(`  ${spec.name.padEnd(24)} /b/${b.code}   ${spec.email} / ${spec.password}`);
}
