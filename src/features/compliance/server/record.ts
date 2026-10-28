// Gathers a batch's compliance record from the features that own the data
// (batches, products, suppliers, brand). All reads are the owner's own,
// through row-level security.
import "server-only";
import { getBatch } from "@/features/batches";
import { getBrandProfile } from "@/features/brand";
import { getTemplate } from "@/features/industries";
import { getProduct } from "@/features/products";
import { listSuppliers } from "@/features/suppliers";
import type { Owner } from "@/lib/auth";
import { dateKeyIn, timeIn } from "@/lib/dates";
import { buildComplianceRecord, type ComplianceRecord } from "../service";

/** The record for one of the owner's batches, or null if it is not theirs. */
export async function loadComplianceRecord(owner: Owner, batchId: string, now: Date): Promise<ComplianceRecord | null> {
  const batch = await getBatch(owner, batchId);
  if (!batch) return null;
  const [product, suppliers, brand] = await Promise.all([getProduct(owner, batch.productId), listSuppliers(owner), getBrandProfile(owner)]);
  if (!product) return null;

  const template = getTemplate(owner.industry);
  const zone = owner.timezone;
  const supplierById = new Map(suppliers.map((supplier) => [supplier.id, supplier]));
  // Templates with includesTime record the time of making too.
  const madeOn = template.dates.made.includesTime
    ? `${dateKeyIn(batch.madeAt, zone)} ${timeIn(batch.madeAt, zone)}`
    : dateKeyIn(batch.madeAt, zone);

  return buildComplianceRecord({
    template,
    brand: { name: brand.name, location: brand.location },
    product: { name: product.name, format: product.format, ingredients: product.ingredients, allergens: product.allergens, extra: product.extra },
    batch: {
      number: batch.number,
      code: batch.code,
      status: batch.status,
      madeOn,
      packagedOn: batch.packagedAt ? dateKeyIn(batch.packagedAt, zone) : null,
      extra: batch.extra,
    },
    lots: batch.lots.map((lot) => {
      const supplier = supplierById.get(lot.supplierId);
      return {
        supplierName: lot.supplierName,
        sourceType: supplier?.sourceType ?? "",
        ingredient: lot.ingredient,
        lotNumber: lot.lotNumber,
        address: supplier?.address ?? "",
        latitude: supplier?.latitude ?? 0,
        longitude: supplier?.longitude ?? 0,
      };
    }),
    stops: batch.stops,
    exportedAt: now,
  });
}
