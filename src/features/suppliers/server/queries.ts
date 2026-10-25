// Supplier reads. Row-level security limits them to the owner's brand.
import "server-only";
import { tenantOf, type Owner } from "@/lib/auth";
import { withTenant } from "@/lib/db";
import { isUuid } from "@/lib/ids";

export type SupplierView = {
  id: string;
  name: string;
  sourceType: string;
  supplies: string;
  address: string;
  latitude: number;
  longitude: number;
};

const SELECT = { id: true, name: true, sourceType: true, supplies: true, address: true, latitude: true, longitude: true };

export function listSuppliers(owner: Owner): Promise<SupplierView[]> {
  return withTenant(tenantOf(owner), (tx) =>
    tx.supplier.findMany({ where: { brandId: owner.brandId }, select: SELECT, orderBy: { name: "asc" } }),
  );
}

/** One supplier, or null if it does not exist (pages then show "not found"). */
export function getSupplier(owner: Owner, supplierId: string): Promise<SupplierView | null> {
  if (!isUuid(supplierId)) return Promise.resolve(null);
  return withTenant(tenantOf(owner), (tx) =>
    tx.supplier.findFirst({ where: { id: supplierId, brandId: owner.brandId }, select: SELECT }),
  );
}
