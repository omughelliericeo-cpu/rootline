-- CreateEnum
CREATE TYPE "ShopperPhotoStatus" AS ENUM ('PENDING', 'APPROVED');

-- CreateTable
CREATE TABLE "shopper_photo" (
    "id" UUID NOT NULL,
    "brand_id" UUID NOT NULL,
    "batch_id" UUID NOT NULL,
    "status" "ShopperPhotoStatus" NOT NULL DEFAULT 'PENDING',
    "photo_path" TEXT NOT NULL,
    "note" TEXT,
    "first_name" TEXT,
    "consent_text" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approved_at" TIMESTAMP(3),

    CONSTRAINT "shopper_photo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "shopper_photo_brand_id_status_created_at_idx" ON "shopper_photo"("brand_id", "status", "created_at");

-- CreateIndex
CREATE INDEX "shopper_photo_batch_id_status_idx" ON "shopper_photo"("batch_id", "status");

-- AddForeignKey
ALTER TABLE "shopper_photo" ADD CONSTRAINT "shopper_photo_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shopper_photo" ADD CONSTRAINT "shopper_photo_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "batch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- Hand-written: ROW LEVEL SECURITY for shopper photos.
--  - The brand reads, approves and deletes its own shopper photos.
--  - The public may ADD a PENDING photo to a published batch (insert only; the
--    app inserts without reading back), for that batch's own brand, and only
--    while the batch has fewer than 50 photos waiting (stops a flood).
--  - The public may read only APPROVED photos of published batches.
-- ---------------------------------------------------------------------------
-- Counts waiting photos without letting the public read them. SECURITY DEFINER
-- runs as the table owner, but it only ever returns one number.
CREATE FUNCTION shopper_photo_pending_count(p_batch uuid) RETURNS integer
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    SELECT count(*)::integer FROM shopper_photo WHERE batch_id = p_batch AND status = 'PENDING';
  $$;
REVOKE ALL ON FUNCTION shopper_photo_pending_count(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION shopper_photo_pending_count(uuid) TO rootline_app;

ALTER TABLE "shopper_photo" ENABLE ROW LEVEL SECURITY;
CREATE POLICY shopper_photo_own_brand ON "shopper_photo" TO rootline_app
  USING (brand_id::text = current_setting('app.brand_id', true))
  WITH CHECK (brand_id::text = current_setting('app.brand_id', true));
CREATE POLICY shopper_photo_public_insert ON "shopper_photo" FOR INSERT TO rootline_app
  WITH CHECK (current_setting('app.public', true) = 'on'
    AND status = 'PENDING' AND approved_at IS NULL
    AND EXISTS (SELECT 1 FROM "batch" b WHERE b.id = shopper_photo.batch_id
                AND b.brand_id = shopper_photo.brand_id AND b.status IN ('LIVE', 'SOLD_OUT'))
    AND shopper_photo_pending_count(shopper_photo.batch_id) < 50);
CREATE POLICY shopper_photo_public_read ON "shopper_photo" FOR SELECT TO rootline_app
  USING (current_setting('app.public', true) = 'on'
    AND status = 'APPROVED'
    AND EXISTS (SELECT 1 FROM "batch" b WHERE b.id = shopper_photo.batch_id AND b.status IN ('LIVE', 'SOLD_OUT')));
