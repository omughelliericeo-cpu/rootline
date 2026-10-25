-- CreateEnum
CREATE TYPE "ScanSource" AS ENUM ('BATCH', 'SHELF');

-- CreateTable
CREATE TABLE "scan_event" (
    "id" UUID NOT NULL,
    "batch_id" UUID NOT NULL,
    "via" "ScanSource" NOT NULL DEFAULT 'BATCH',
    "scanned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "country" TEXT,
    "region" TEXT,
    "city" TEXT,

    CONSTRAINT "scan_event_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "scan_event_batch_id_scanned_at_idx" ON "scan_event"("batch_id", "scanned_at");

-- AddForeignKey
ALTER TABLE "scan_event" ADD CONSTRAINT "scan_event_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "batch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- Hand-written: PUBLIC READ ACCESS for story pages (/b/{code}, /s/{code}).
--
-- src/lib/db.ts withPublic() sets app.public = 'on' (and no user or brand).
-- These extra policies then allow reading ONLY what a published story page
-- shows: LIVE or SOLD_OUT batches, and their brand, people, product, lots,
-- suppliers, stops and currently valid certificates. Nothing else is ever
-- readable in public mode: no drafts, no other products, no recall emails,
-- no tips. Policies are combined with OR, so producers' own access is unchanged.
-- ---------------------------------------------------------------------------

CREATE POLICY batch_public_read ON "batch" FOR SELECT TO rootline_app
  USING (current_setting('app.public', true) = 'on' AND status IN ('LIVE', 'SOLD_OUT'));

CREATE POLICY brand_public_read ON "brand" FOR SELECT TO rootline_app
  USING (current_setting('app.public', true) = 'on'
    AND EXISTS (SELECT 1 FROM "batch" b WHERE b.brand_id = brand.id AND b.status IN ('LIVE', 'SOLD_OUT')));

CREATE POLICY brand_person_public_read ON "brand_person" FOR SELECT TO rootline_app
  USING (current_setting('app.public', true) = 'on'
    AND EXISTS (SELECT 1 FROM "batch" b WHERE b.brand_id = brand_person.brand_id AND b.status IN ('LIVE', 'SOLD_OUT')));

CREATE POLICY product_public_read ON "product" FOR SELECT TO rootline_app
  USING (current_setting('app.public', true) = 'on'
    AND EXISTS (SELECT 1 FROM "batch" b WHERE b.product_id = product.id AND b.status IN ('LIVE', 'SOLD_OUT')));

CREATE POLICY batch_lot_public_read ON "batch_lot" FOR SELECT TO rootline_app
  USING (current_setting('app.public', true) = 'on'
    AND EXISTS (SELECT 1 FROM "batch" b WHERE b.id = batch_lot.batch_id AND b.status IN ('LIVE', 'SOLD_OUT')));

CREATE POLICY route_stop_public_read ON "route_stop" FOR SELECT TO rootline_app
  USING (current_setting('app.public', true) = 'on'
    AND EXISTS (SELECT 1 FROM "batch" b WHERE b.id = route_stop.batch_id AND b.status IN ('LIVE', 'SOLD_OUT')));

CREATE POLICY supplier_public_read ON "supplier" FOR SELECT TO rootline_app
  USING (current_setting('app.public', true) = 'on'
    AND EXISTS (SELECT 1 FROM "batch_lot" l JOIN "batch" b ON b.id = l.batch_id
                WHERE l.supplier_id = supplier.id AND b.status IN ('LIVE', 'SOLD_OUT')));

-- Only VALID certificates near or before expiry are readable (a day of slack for
-- time zones; the app does the exact expiry check). Brand-wide, product or supplier.
CREATE POLICY certificate_public_read ON "certificate" FOR SELECT TO rootline_app
  USING (current_setting('app.public', true) = 'on'
    AND status = 'VALID'
    AND expires_on >= (current_date - 1)
    AND EXISTS (SELECT 1 FROM "batch" b WHERE b.brand_id = certificate.brand_id AND b.status IN ('LIVE', 'SOLD_OUT')));

-- Shelf codes can be looked up publicly only when they point at a published batch.
CREATE POLICY shelf_code_public_read ON "shelf_code" FOR SELECT TO rootline_app
  USING (current_setting('app.public', true) = 'on'
    AND EXISTS (SELECT 1 FROM "batch" b WHERE b.id = shelf_code.batch_id AND b.status IN ('LIVE', 'SOLD_OUT')));

-- Scan events: the public may only ADD scans of published batches; reading
-- them is for the brand only.
ALTER TABLE "scan_event" ENABLE ROW LEVEL SECURITY;
CREATE POLICY scan_event_own_brand ON "scan_event" FOR SELECT TO rootline_app
  USING (EXISTS (SELECT 1 FROM "batch" b WHERE b.id = scan_event.batch_id AND b.brand_id::text = current_setting('app.brand_id', true)));
CREATE POLICY scan_event_public_insert ON "scan_event" FOR INSERT TO rootline_app
  WITH CHECK (current_setting('app.public', true) = 'on'
    AND EXISTS (SELECT 1 FROM "batch" b WHERE b.id = scan_event.batch_id AND b.status IN ('LIVE', 'SOLD_OUT')));
