// Demo data: the brewery "Cedar & Tide" (Port Moody, BC) with batch 214,
// published, so the story page can be seen at /b/cedarpm2.
// Safe to run again: it removes the previous Cedar & Tide demo first.
// Runs as the database owner (DIRECT_URL), so row-level security does not apply.
//   npm run db:seed
// The other industries' demo brands are added in Milestone 9.
import { PrismaPg } from "@prisma/adapter-pg";
import { createClient } from "@supabase/supabase-js";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { PrismaClient } from "../src/generated/prisma/client";

try {
  process.loadEnvFile(".env");
} catch {
  // Environment variables come from the shell instead.
}

const DEMO_EMAIL = "demo@cedarandtide.test";
const DEMO_PASSWORD = process.env.SEED_DEMO_PASSWORD ?? "CedarTide-demo-2026";
const BATCH_CODE = "cedarpm2";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL! }) });
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });

const daysAgo = (days: number) => new Date(Date.now() - days * 86_400_000);
/** A @db.Date value N days ago. */
const dateDaysAgo = (days: number) => new Date(`${daysAgo(days).toISOString().slice(0, 10)}T00:00:00Z`);

/** The demo owner's Supabase user (created already confirmed, so no email is sent). */
async function demoUserId(): Promise<string> {
  const created = await supabase.auth.admin.createUser({ email: DEMO_EMAIL, password: DEMO_PASSWORD, email_confirm: true });
  if (created.data.user) return created.data.user.id;
  const { data, error } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (error) throw error;
  const existing = data.users.find((user) => user.email === DEMO_EMAIL);
  if (!existing) throw created.error ?? new Error("Could not create the demo user");
  await supabase.auth.admin.updateUserById(existing.id, { password: DEMO_PASSWORD });
  return existing.id;
}

/** A one-page PDF standing in for the real B Corp certificate. */
async function demoCertificatePdf(): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595, 842]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  page.drawText("DEMO CERTIFICATE - Certified B Corporation - Cedar & Tide Brewing", { x: 50, y: 780, size: 12, font });
  page.drawText("Sample file for the Rootline demo. Not a real certificate.", { x: 50, y: 760, size: 10, font });
  return pdf.save();
}

async function main() {
  const ownerUserId = await demoUserId();
  await prisma.brand.deleteMany({ where: { ownerUserId } });

  const brand = await prisma.brand.create({
    data: {
      ownerUserId,
      industry: "brewery",
      name: "Cedar & Tide",
      location: "Port Moody, BC",
      latitude: 49.2838,
      longitude: -122.8317,
      quote: "We drive up to Armstrong every harvest. I want to know the guy who grew the barley by name.",
      people: {
        create: [
          { name: "Jess Ramirez", role: "Head brewer", position: 0 },
          { name: "Dan Kowalski", role: "Barley farmer, Armstrong", position: 1 },
          { name: "The Singh family", role: "Hop growers, Lillooet", position: 2 },
        ],
      },
    },
  });

  const [kowalski, singh] = await Promise.all([
    prisma.supplier.create({
      data: { brandId: brand.id, name: "Kowalski Farm", sourceType: "maltster", supplies: "Barley", address: "Armstrong, BC", latitude: 50.4481, longitude: -119.1964 },
    }),
    prisma.supplier.create({
      data: { brandId: brand.id, name: "Singh Hop Farm", sourceType: "hop-farm", supplies: "Hops", address: "Lillooet, BC", latitude: 50.6866, longitude: -121.9361 },
    }),
  ]);

  const product = await prisma.product.create({
    data: {
      brandId: brand.id,
      name: "Hazy Pale Ale",
      format: "473 ml can",
      ingredients: ["Water", "Malted barley", "Oats", "Hops", "Yeast"],
      allergens: ["Gluten (barley)", "Gluten (oats)"],
      extra: { style: "Hazy Pale Ale", abv: 6.2, ibu: 35 },
    },
  });

  const filePath = `${brand.id}/certificate/demo-b-corp.pdf`;
  const upload = await supabase.storage
    .from("certificates")
    .upload(filePath, await demoCertificatePdf(), { contentType: "application/pdf", upsert: true });
  if (upload.error) throw upload.error;
  await prisma.certificate.create({
    data: {
      brandId: brand.id,
      claim: "b-corp",
      issuer: "B Lab",
      expiresOn: dateDaysAgo(-700),
      filePath,
      fileName: "b-corp-certificate.pdf",
      fileType: "application/pdf",
    },
  });

  await prisma.batch.deleteMany({ where: { code: BATCH_CODE } });
  await prisma.batch.create({
    data: {
      brandId: brand.id,
      productId: product.id,
      code: BATCH_CODE,
      number: 214,
      status: "LIVE",
      madeAt: daysAgo(23),
      packagedAt: daysAgo(9),
      publishedAt: daysAgo(9),
      lots: {
        create: [
          { supplierId: kowalski.id, ingredient: "Pilsner malt", lotNumber: "KF-2026-118", position: 0 },
          { supplierId: singh.id, ingredient: "Citra hops", lotNumber: "SH-26-042", position: 1 },
        ],
      },
      stops: {
        create: [
          { position: 1, name: "Cedar & Tide, Port Moody", type: "brewery", address: "Port Moody, BC", latitude: 49.2838, longitude: -122.8317, arrivedOn: dateDaysAgo(9) },
          { position: 2, name: "Coquitlam cold storage", type: "cold-storage", address: "Coquitlam, BC", latitude: 49.2524, longitude: -122.8058, arrivedOn: dateDaysAgo(8), note: "Held at 3°C" },
          { position: 3, name: "Burnaby warehouse", type: "distributor", address: "Burnaby, BC", latitude: 49.2488, longitude: -122.9805, arrivedOn: dateDaysAgo(7) },
          { position: 4, name: "Main Street Bottle Shop", type: "store", address: "Main St, Vancouver, BC", latitude: 49.2627, longitude: -123.1007, arrivedOn: dateDaysAgo(5), note: "On the shelf, kept cold" },
        ],
      },
    },
  });

  console.log(`Seeded Cedar & Tide. Story page: /b/${BATCH_CODE}. Demo login: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
