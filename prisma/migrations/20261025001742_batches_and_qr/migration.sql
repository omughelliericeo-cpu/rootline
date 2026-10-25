-- CreateEnum
CREATE TYPE "BatchStatus" AS ENUM ('DRAFT', 'LIVE', 'SOLD_OUT');

-- CreateTable
CREATE TABLE "batch" (
    "id" UUID NOT NULL,
    "brand_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "status" "BatchStatus" NOT NULL DEFAULT 'DRAFT',
    "made_at" TIMESTAMP(3) NOT NULL,
    "packaged_at" TIMESTAMP(3),
    "extra" JSONB NOT NULL DEFAULT '{}',
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "batch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "batch_lot" (
    "id" UUID NOT NULL,
    "batch_id" UUID NOT NULL,
    "supplier_id" UUID NOT NULL,
    "ingredient" TEXT NOT NULL,
    "lot_number" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "batch_lot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "route_stop" (
    "id" UUID NOT NULL,
    "batch_id" UUID NOT NULL,
    "position" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "arrived_on" DATE,
    "note" TEXT,

    CONSTRAINT "route_stop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shelf_code" (
    "id" UUID NOT NULL,
    "brand_id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "batch_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shelf_code_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "batch_code_key" ON "batch"("code");

-- CreateIndex
CREATE INDEX "batch_brand_id_created_at_idx" ON "batch"("brand_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "batch_product_id_number_key" ON "batch"("product_id", "number");

-- CreateIndex
CREATE INDEX "batch_lot_batch_id_idx" ON "batch_lot"("batch_id");

-- CreateIndex
CREATE INDEX "batch_lot_supplier_id_idx" ON "batch_lot"("supplier_id");

-- CreateIndex
CREATE INDEX "route_stop_batch_id_idx" ON "route_stop"("batch_id");

-- CreateIndex
CREATE UNIQUE INDEX "shelf_code_code_key" ON "shelf_code"("code");

-- CreateIndex
CREATE INDEX "shelf_code_brand_id_idx" ON "shelf_code"("brand_id");

-- AddForeignKey
ALTER TABLE "batch" ADD CONSTRAINT "batch_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batch" ADD CONSTRAINT "batch_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batch_lot" ADD CONSTRAINT "batch_lot_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "batch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batch_lot" ADD CONSTRAINT "batch_lot_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "supplier"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "route_stop" ADD CONSTRAINT "route_stop_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "batch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shelf_code" ADD CONSTRAINT "shelf_code_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shelf_code" ADD CONSTRAINT "shelf_code_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "batch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- Hand-written: ROW LEVEL SECURITY (see the first migration for how
-- app.brand_id is set). Lots and stops have no brand_id of their own; they
-- are visible when their batch is.
-- ---------------------------------------------------------------------------
ALTER TABLE "batch" ENABLE ROW LEVEL SECURITY;
CREATE POLICY batch_own_brand ON "batch" TO rootline_app
  USING (brand_id::text = current_setting('app.brand_id', true))
  WITH CHECK (brand_id::text = current_setting('app.brand_id', true));

ALTER TABLE "shelf_code" ENABLE ROW LEVEL SECURITY;
CREATE POLICY shelf_code_own_brand ON "shelf_code" TO rootline_app
  USING (brand_id::text = current_setting('app.brand_id', true))
  WITH CHECK (brand_id::text = current_setting('app.brand_id', true));

ALTER TABLE "batch_lot" ENABLE ROW LEVEL SECURITY;
CREATE POLICY batch_lot_own_brand ON "batch_lot" TO rootline_app
  USING (EXISTS (SELECT 1 FROM "batch" b WHERE b.id = batch_id AND b.brand_id::text = current_setting('app.brand_id', true)))
  WITH CHECK (EXISTS (SELECT 1 FROM "batch" b WHERE b.id = batch_id AND b.brand_id::text = current_setting('app.brand_id', true)));

ALTER TABLE "route_stop" ENABLE ROW LEVEL SECURITY;
CREATE POLICY route_stop_own_brand ON "route_stop" TO rootline_app
  USING (EXISTS (SELECT 1 FROM "batch" b WHERE b.id = batch_id AND b.brand_id::text = current_setting('app.brand_id', true)))
  WITH CHECK (EXISTS (SELECT 1 FROM "batch" b WHERE b.id = batch_id AND b.brand_id::text = current_setting('app.brand_id', true)));
