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
  // The app stores times as UTC in columns without a time zone. Without this,
  // now() would be saved in the database server's local time, hours off, and
  // "Canned today" would read "yesterday" in the evening.
  await client.query("SET TIME ZONE 'UTC'");
  try {
    return await work(client);
  } finally {
    await client.end();
  }
}

/**
 * A confirmed producer with a brand. Brands start on Growth, like a real
 * sign-up during its free trial; pass "STARTER" to test plan limits.
 */
export async function createTestProducer(industry = "brewery", plan: "STARTER" | "GROWTH" = "GROWTH"): Promise<TestProducer> {
  const stamp = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  const email = `e2e-${stamp}@rootline.test`;
  const password = `Test-${stamp}!`;
  const brandName = `E2E Brewing ${stamp}`;

  const { data, error } = await admin().auth.admin.createUser({ email, password, email_confirm: true });
  if (error || !data.user) throw error ?? new Error("createUser returned no user");

  const brandId = await asOwner(async (client) => {
    const result = await client.query<{ id: string }>(
      `INSERT INTO brand (id, owner_user_id, industry, name, location, plan, updated_at)
       VALUES (gen_random_uuid(), $1, $2, $3, 'Port Moody, BC', $4::"Plan", now()) RETURNING id`,
      [data.user.id, industry, brandName, plan],
    );
    return result.rows[0]!.id;
  });

  return { email, password, userId: data.user.id, brandId, brandName };
}

/** A confirmed login with no brand, like an account whose brand lives in another database. */
export async function createLoginWithoutBrand(): Promise<TestProducer> {
  const producer = await createTestProducer();
  await asOwner((client) => client.query("DELETE FROM brand WHERE owner_user_id = $1", [producer.userId]));
  return producer;
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
    ["brand-media", ["logo", "photo", "person", "product", "supplier", "shopper"]],
    ["certificates", ["certificate"]],
    ["shopper-photos", ["shopper"]],
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
  // A 1x1 PNG standing in for a photo of the farm.
  const supplierPhoto = `${producer.brandId}/supplier/e2e-farm.png`;
  const photo = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
  const photoUpload = await admin().storage.from("brand-media").upload(supplierPhoto, photo, { contentType: "image/png", upsert: true });
  if (photoUpload.error) throw photoUpload.error;

  const batchId = await asOwner(async (client) => {
    const one = async (sql: string, params: unknown[]) => (await client.query<{ id: string }>(sql, params)).rows[0]!.id;
    const brand = producer.brandId;
    const supplier = await one(
      `INSERT INTO supplier (id, brand_id, name, source_type, supplies, address, latitude, longitude, photo_path, updated_at)
       VALUES (gen_random_uuid(), $1, 'Kowalski Farm', 'maltster', 'Barley', 'Armstrong, BC', 50.4481, -119.1964, $2, now()) RETURNING id`,
      [brand, supplierPhoto],
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

/** The unsubscribe code and status of one recall subscriber (tests read it like the email would contain it). */
export async function recallSubscriber(batchId: string, email: string): Promise<{ token: string; unsubscribed: boolean } | null> {
  return asOwner(async (client) => {
    const row = (await client.query("SELECT unsubscribe_token, unsubscribed_at FROM recall_subscriber WHERE batch_id = $1 AND email = $2", [batchId, email])).rows[0];
    return row ? { token: row.unsubscribe_token, unsubscribed: row.unsubscribed_at !== null } : null;
  });
}

export type StoredShopperPhoto = { status: string; note: string | null; firstName: string | null; photoPath: string };

/** The shopper photos the database holds for a batch, oldest first. */
export async function shopperPhotos(batchId: string): Promise<StoredShopperPhoto[]> {
  return asOwner(async (client) =>
    (
      await client.query(
        "SELECT status, note, first_name AS \"firstName\", photo_path AS \"photoPath\" FROM shopper_photo WHERE batch_id = $1 ORDER BY created_at",
        [batchId],
      )
    ).rows,
  );
}

/** Downloads a stored file's bytes straight from storage (as the admin). */
export async function storedFile(bucket: string, path: string): Promise<Buffer | null> {
  const { data } = await admin().storage.from(bucket).download(path);
  return data ? Buffer.from(await data.arrayBuffer()) : null;
}

/** Whether storage still lists a file. (A download can be served from cache for a while after a delete.) */
export async function fileExists(bucket: string, path: string): Promise<boolean> {
  const folder = path.slice(0, path.lastIndexOf("/"));
  const name = path.slice(path.lastIndexOf("/") + 1);
  const { data } = await admin().storage.from(bucket).list(folder, { search: name });
  return (data ?? []).some((file) => file.name === name);
}

/** Adds published batches of the producer's first product (for plan-limit tests). */
export async function addLiveBatches(producer: TestProducer, count: number): Promise<void> {
  await asOwner(async (client) => {
    const product = (await client.query("SELECT id FROM product WHERE brand_id = $1 LIMIT 1", [producer.brandId])).rows[0].id;
    for (let n = 0; n < count; n += 1) {
      await client.query(
        `INSERT INTO batch (id, brand_id, product_id, code, number, status, made_at, packaged_at, published_at, updated_at)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, 'LIVE', now(), now(), now(), now())`,
        [producer.brandId, product, "lv" + Math.random().toString(36).replace(/[^a-hjkmnp-z2-9]/g, "").padEnd(6, "k").slice(0, 6), 900 + n],
      );
    }
  });
}

/** Sets a batch's status directly (test set-up only). */
export async function setBatchStatus(batchId: string, status: "DRAFT" | "LIVE" | "SOLD_OUT"): Promise<void> {
  await asOwner((client) => client.query(`UPDATE batch SET status = $2::"BatchStatus" WHERE id = $1`, [batchId, status]));
}

/** How many scans the database holds for a batch. */
export async function scanCount(batchId: string): Promise<number> {
  return asOwner(async (client) => Number((await client.query("SELECT count(*) FROM scan_event WHERE batch_id = $1", [batchId])).rows[0].count));
}

/**
 * Clicks a producer menu link. On a phone the links sit in the folded "Menu",
 * so it is opened first; on a large screen the sidebar is used.
 */
export async function goToMenu(page: Page, name: string | RegExp): Promise<void> {
  const menu = page.getByRole("banner").getByText("Menu", { exact: true });
  if (await menu.isVisible()) await menu.click();
  await page.getByRole("navigation", { name: "Producer" }).getByRole("link", { name }).filter({ visible: true }).first().click();
}

/** Logs out with the button at the bottom of the producer menu. */
export async function logOut(page: Page): Promise<void> {
  const menu = page.getByRole("banner").getByText("Menu", { exact: true });
  if (await menu.isVisible()) await menu.click();
  await page.getByRole("button", { name: "Log out" }).filter({ visible: true }).first().click();
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

/** The link a "reset your password" email would hold (token_hash template); no email is sent. */
export async function recoveryLink(email: string): Promise<string> {
  const { data, error } = await admin().auth.admin.generateLink({ type: "recovery", email });
  if (error || !data.properties) throw error ?? new Error("generateLink returned no link");
  return `/auth/confirm?token_hash=${data.properties.hashed_token}&type=recovery`;
}

/** Whether the producer's login and brand still exist (after deleting the account). */
export async function accountState(producer: TestProducer): Promise<{ login: boolean; brand: boolean }> {
  const { data } = await admin().auth.admin.getUserById(producer.userId);
  const brand = await asOwner(async (client) => (await client.query("SELECT 1 FROM brand WHERE id = $1", [producer.brandId])).rowCount ?? 0);
  return { login: Boolean(data.user), brand: brand > 0 };
}

/** Stores a small file straight into storage (test set-up only). */
export async function putFile(bucket: string, path: string): Promise<void> {
  const { error } = await admin().storage.from(bucket).upload(path, new Blob(["test"], { type: "image/png" }), { upsert: true });
  if (error) throw error;
}
