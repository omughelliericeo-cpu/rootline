-- Hand-written. The "still in use" foreign keys (ON DELETE NO ACTION) are
-- checked at the end of the transaction instead of after each internal
-- statement. Deleting a single product or supplier that is in use still
-- fails, but deleting a whole brand can cascade through products, batches,
-- lots and certificates in any order. Prisma's schema cannot express
-- DEFERRABLE, so it lives here.
ALTER TABLE "certificate" ALTER CONSTRAINT "certificate_product_id_fkey" DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE "certificate" ALTER CONSTRAINT "certificate_supplier_id_fkey" DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE "batch" ALTER CONSTRAINT "batch_product_id_fkey" DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE "batch_lot" ALTER CONSTRAINT "batch_lot_supplier_id_fkey" DEFERRABLE INITIALLY DEFERRED;
