-- CreateEnum
CREATE TYPE "CertificateStatus" AS ENUM ('VALID', 'REVOKED');

-- CreateTable
CREATE TABLE "supplier" (
    "id" UUID NOT NULL,
    "brand_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "source_type" TEXT NOT NULL,
    "supplies" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product" (
    "id" UUID NOT NULL,
    "brand_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "ingredients" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "allergens" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "dietary_tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "photo_path" TEXT,
    "extra" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certificate" (
    "id" UUID NOT NULL,
    "brand_id" UUID NOT NULL,
    "product_id" UUID,
    "supplier_id" UUID,
    "claim" TEXT NOT NULL,
    "issuer" TEXT NOT NULL,
    "expires_on" DATE NOT NULL,
    "status" "CertificateStatus" NOT NULL DEFAULT 'VALID',
    "file_path" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_type" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "certificate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "supplier_brand_id_idx" ON "supplier"("brand_id");

-- CreateIndex
CREATE INDEX "product_brand_id_idx" ON "product"("brand_id");

-- CreateIndex
CREATE INDEX "certificate_brand_id_idx" ON "certificate"("brand_id");

-- CreateIndex
CREATE INDEX "certificate_product_id_idx" ON "certificate"("product_id");

-- CreateIndex
CREATE INDEX "certificate_supplier_id_idx" ON "certificate"("supplier_id");

-- AddForeignKey
ALTER TABLE "supplier" ADD CONSTRAINT "supplier_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product" ADD CONSTRAINT "product_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificate" ADD CONSTRAINT "certificate_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificate" ADD CONSTRAINT "certificate_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificate" ADD CONSTRAINT "certificate_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- Hand-written: rules and ROW LEVEL SECURITY (see the first migration for how
-- app.brand_id is set). Grants come from the default privileges set there.
-- ---------------------------------------------------------------------------

-- A certificate covers the brand, or one product, or one supplier, never both.
ALTER TABLE "certificate" ADD CONSTRAINT certificate_single_scope
  CHECK (product_id IS NULL OR supplier_id IS NULL);

ALTER TABLE "supplier" ENABLE ROW LEVEL SECURITY;
CREATE POLICY supplier_own_brand ON "supplier" TO rootline_app
  USING (brand_id::text = current_setting('app.brand_id', true))
  WITH CHECK (brand_id::text = current_setting('app.brand_id', true));

ALTER TABLE "product" ENABLE ROW LEVEL SECURITY;
CREATE POLICY product_own_brand ON "product" TO rootline_app
  USING (brand_id::text = current_setting('app.brand_id', true))
  WITH CHECK (brand_id::text = current_setting('app.brand_id', true));

ALTER TABLE "certificate" ENABLE ROW LEVEL SECURITY;
CREATE POLICY certificate_own_brand ON "certificate" TO rootline_app
  USING (brand_id::text = current_setting('app.brand_id', true))
  WITH CHECK (brand_id::text = current_setting('app.brand_id', true));
