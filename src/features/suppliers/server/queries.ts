// Supplier reads. Row-level security limits them to the owner's brand.
import "server-only";
import { tenantOf, type Owner } from "@/lib/auth";
import { withTenant } from "@/lib/db";
import { isUuid } from "@/lib/ids";
import { publicMediaUrl } from "@/lib/storage";

export type SupplierView = {
  id: string;
  name: string;
  sourceType: string;
  supplies: string;
  address: string;
  latitude: number;
  longitude: number;
  photoUrl: string | null;
};

const SELECT = { id: true, name: true, sourceType: true, supplies: true, address: true, latitude: true, longitude: true, photoPath: true };

function toView({ photoPath, ...row }: Omit<SupplierView, "photoUrl"> & { photoPath: string | null }): SupplierView {
  return { ...row, photoUrl: photoPath ? publicMediaUrl(photoPath) : null };
}

export async function listSuppliers(owner: Owner): Promise<SupplierView[]> {
  const rows = await withTenant(tenantOf(owner), (tx) =>
    tx.supplier.findMany({ where: { brandId: owner.brandId }, select: SELECT, orderBy: { name: "asc" } }),
  );
  return rows.map(toView);
}

/** One supplier, or null if it does not exist (pages then show "not found"). */
export async function getSupplier(owner: Owner, supplierId: string): Promise<SupplierView | null> {
  if (!isUuid(supplierId)) return null;
  const row = await withTenant(tenantOf(owner), (tx) =>
    tx.supplier.findFirst({ where: { id: supplierId, brandId: owner.brandId }, select: SELECT }),
  );
  return row ? toView(row) : null;
}
