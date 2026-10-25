// Test helper: creates a producer account that is already email-confirmed,
// with its brand, so journeys can log straight in. Uses the Supabase admin
// API (no confirmation email is sent) and the database owner connection.
// Uses plain `pg` (installed with Prisma's adapter) because Playwright loads
// helpers as CommonJS, which cannot import the generated Prisma client.
import type { Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { Client } from "pg";

export type TestProducer = { email: string; password: string; userId: string; brandId: string; brandName: string };

function admin() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });
}

async function asOwner<T>(work: (client: Client) => Promise<T>): Promise<T> {
  const client = new Client({ connectionString: process.env.DIRECT_URL });
  await client.connect();
  try {
    return await work(client);
  } finally {
    await client.end();
  }
}

export async function createTestProducer(industry = "brewery"): Promise<TestProducer> {
  const stamp = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  const email = `e2e-${stamp}@rootline.test`;
  const password = `Test-${stamp}!`;
  const brandName = `E2E Brewing ${stamp}`;

  const { data, error } = await admin().auth.admin.createUser({ email, password, email_confirm: true });
  if (error || !data.user) throw error ?? new Error("createUser returned no user");

  const brandId = await asOwner(async (client) => {
    const result = await client.query<{ id: string }>(
      `INSERT INTO brand (id, owner_user_id, industry, name, location, updated_at)
       VALUES (gen_random_uuid(), $1, $2, $3, 'Port Moody, BC', now()) RETURNING id`,
      [data.user.id, industry, brandName],
    );
    return result.rows[0]!.id;
  });

  return { email, password, userId: data.user.id, brandId, brandName };
}

/** Removes the user, their brand (cascading to everything else) and their uploaded files. */
export async function deleteTestProducer(producer: TestProducer): Promise<void> {
  await asOwner((client) => client.query("DELETE FROM brand WHERE owner_user_id = $1", [producer.userId]));
  await removeUploads(producer.brandId);
  await admin().auth.admin.deleteUser(producer.userId);
}

async function removeUploads(brandId: string): Promise<void> {
  const storage = admin().storage;
  const folders: Array<[string, string[]]> = [
    ["brand-media", ["logo", "photo", "person", "product"]],
    ["certificates", ["certificate"]],
  ];
  for (const [bucket, kinds] of folders) {
    for (const kind of kinds) {
      const folder = `${brandId}/${kind}`;
      const { data } = await storage.from(bucket).list(folder);
      const paths = (data ?? []).map((file) => `${folder}/${file.name}`);
      if (paths.length > 0) await storage.from(bucket).remove(paths);
    }
  }
}

/** Adds a supplier and a product straight into the database, for journeys that start later. */
export async function seedCatalogue(producer: TestProducer): Promise<void> {
  await asOwner(async (client) => {
    await client.query(
      `INSERT INTO supplier (id, brand_id, name, source_type, supplies, address, latitude, longitude, updated_at)
       VALUES (gen_random_uuid(), $1, 'Kowalski Farm', 'maltster', 'Pilsner malt', 'Armstrong, BC', 50.4148, -119.1937, now())`,
      [producer.brandId],
    );
    await client.query(
      `INSERT INTO product (id, brand_id, name, format, ingredients, allergens, extra, updated_at)
       VALUES (gen_random_uuid(), $1, 'Hazy Pale Ale', '473 ml can', ARRAY['Water','Malted barley','Hops','Yeast'], ARRAY['Gluten (barley)'], '{"abv": 6.2}', now())`,
      [producer.brandId],
    );
  });
}

export type PublishedStory = { batchCode: string; draftCode: string; shelfCode: string; batchId: string };

/**
 * A published brew with lots, stops and a valid B Corp certificate (file in
 * storage), plus a draft brew and a shelf code, for the shopper journey.
 */
export async function seedPublishedStory(producer: TestProducer): Promise<PublishedStory> {
  // Same alphabet as src/lib/codes.ts: codes with 0/1/i/l/o are rejected as not ours.
  const alphabet = "23456789abcdefghjkmnpqrstuvwxyz";
  const suffix = Array.from({ length: 6 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
  const codes = { batchCode: `pb${suffix}`, draftCode: `dr${suffix}`, shelfCode: `sh${suffix}` };
  const filePath = `${producer.brandId}/certificate/e2e-b-corp.pdf`;
  const pdf = Buffer.from(
    "%PDF-1.1\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[]/Count 0>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF",
  );
  const upload = await admin().storage.from("certificates").upload(filePath, pdf, { contentType: "application/pdf", upsert: true });
  if (upload.error) throw upload.error;

  const batchId = await asOwner(async (client) => {
    const one = async (sql: string, params: unknown[]) => (await client.query<{ id: string }>(sql, params)).rows[0]!.id;
    const brand = producer.brandId;
    const supplier = await one(
      `INSERT INTO supplier (id, brand_id, name, source_type, supplies, address, latitude, longitude, updated_at)
       VALUES (gen_random_uuid(), $1, 'Kowalski Farm', 'maltster', 'Barley', 'Armstrong, BC', 50.4481, -119.1964, now()) RETURNING id`,
      [brand],
    );
    const product = await one(
      `INSERT INTO product (id, brand_id, name, format, ingredients, allergens, updated_at)
       VALUES (gen_random_uuid(), $1, 'Hazy Pale Ale', '473 ml can', ARRAY['Water','Malted barley','Hops','Yeast'], ARRAY['Gluten (barley)'], now()) RETURNING id`,
      [brand],
    );
    await client.query(
      `INSERT INTO certificate (id, brand_id, claim, issuer, expires_on, file_path, file_name, file_type, updated_at)
       VALUES (gen_random_uuid(), $1, 'b-corp', 'B Lab', now() + interval '1 year', $2, 'b-corp.pdf', 'application/pdf', now())`,
      [brand, filePath],
    );
    const live = await one(
      `INSERT INTO batch (id, brand_id, product_id, code, number, status, made_at, packaged_at, published_at, updated_at)
       VALUES (gen_random_uuid(), $1, $2, $3, 214, 'LIVE', now() - interval '14 days', now(), now(), now()) RETURNING id`,
      [brand, product, codes.batchCode],
    );
    await client.query(
      `INSERT INTO batch (id, brand_id, product_id, code, number, status, made_at, updated_at)
       VALUES (gen_random_uuid(), $1, $2, $3, 215, 'DRAFT', now(), now())`,
      [brand, product, codes.draftCode],
    );
    await client.query(`INSERT INTO batch_lot (id, batch_id, supplier_id, ingredient, lot_number) VALUES (gen_random_uuid(), $1, $2, 'Pilsner malt', 'KF-2026-118')`, [live, supplier]);
    await client.query(
      `INSERT INTO route_stop (id, batch_id, position, name, type, address, latitude, longitude, note) VALUES
       (gen_random_uuid(), $1, 1, 'Port Moody brewery', 'brewery', 'Port Moody, BC', 49.2838, -122.8317, NULL),
       (gen_random_uuid(), $1, 2, 'Coquitlam cold storage', 'cold-storage', 'Coquitlam, BC', 49.2524, -122.8058, 'Held at 3°C')`,
      [live],
    );
    await client.query(
      `INSERT INTO shelf_code (id, brand_id, code, label, batch_id, updated_at) VALUES (gen_random_uuid(), $1, $2, 'Fridge door', $3, now())`,
      [brand, codes.shelfCode, live],
    );
    return live;
  });
  return { ...codes, batchId };
}

/** How many scans the database holds for a batch. */
export async function scanCount(batchId: string): Promise<number> {
  return asOwner(async (client) => Number((await client.query("SELECT count(*) FROM scan_event WHERE batch_id = $1", [batchId])).rows[0].count));
}

/** Logs in through the real form and waits for the dashboard. */
export async function logIn(page: Page, producer: TestProducer): Promise<void> {
  await page.goto("/login");
  await page.getByLabel("Email").fill(producer.email);
  await page.getByLabel("Password").fill(producer.password);
  await page.getByRole("button", { name: "Log in" }).click();
  // Generous timeout: the first visit compiles the dashboard in dev mode.
  await page.waitForURL(/\/dashboard/, { timeout: 20_000 });
}
