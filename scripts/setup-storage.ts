// Creates the Supabase Storage buckets Rootline needs. Safe to run more than
// once: existing buckets are updated to the settings below.
//   npm run storage:setup
import { createClient } from "@supabase/supabase-js";

const BUCKETS = [
  {
    // Logos, brand photos and portraits shown on public story pages.
    name: "brand-media",
    public: true,
    fileSizeLimit: 4 * 1024 * 1024,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
  },
  {
    // Certificate files. Private: only reachable through short-lived signed links.
    name: "certificates",
    public: false,
    fileSizeLimit: 4 * 1024 * 1024,
    allowedMimeTypes: ["application/pdf", "image/jpeg", "image/png", "image/webp"],
  },
];

async function main() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env first.");

  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const { data: existing, error } = await supabase.storage.listBuckets();
  if (error) throw error;

  for (const { name, ...options } of BUCKETS) {
    const exists = existing.some((bucket) => bucket.name === name);
    const result = exists
      ? await supabase.storage.updateBucket(name, options)
      : await supabase.storage.createBucket(name, options);
    if (result.error) throw result.error;
    console.log(`${exists ? "Updated" : "Created"} bucket "${name}"`);
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
