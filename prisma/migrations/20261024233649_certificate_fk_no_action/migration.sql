-- DropForeignKey
ALTER TABLE "certificate" DROP CONSTRAINT "certificate_product_id_fkey";

-- DropForeignKey
ALTER TABLE "certificate" DROP CONSTRAINT "certificate_supplier_id_fkey";

-- AddForeignKey
ALTER TABLE "certificate" ADD CONSTRAINT "certificate_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificate" ADD CONSTRAINT "certificate_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "supplier"("id") ON DELETE NO ACTION ON UPDATE CASCADE;
