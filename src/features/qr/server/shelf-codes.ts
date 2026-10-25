// Shelf code reads. Row-level security limits them to the owner's brand.
import "server-only";
import { tenantOf, type Owner } from "@/lib/auth";
import { withTenant } from "@/lib/db";
import { isUuid } from "@/lib/ids";

export type ShelfCodeView = {
  id: string;
  code: string;
  label: string;
  batch: { id: string; number: number; status: string; productName: string } | null;
};

const SELECT = {
  id: true,
  code: true,
  label: true,
  batch: { select: { id: true, number: true, status: true, product: { select: { name: true } } } },
} as const;

type Row = { id: string; code: string; label: string; batch: { id: string; number: number; status: string; product: { name: string } } | null };

function toView(row: Row): ShelfCodeView {
  const { batch, ...rest } = row;
  return { ...rest, batch: batch ? { id: batch.id, number: batch.number, status: batch.status, productName: batch.product.name } : null };
}

export async function listShelfCodes(owner: Owner): Promise<ShelfCodeView[]> {
  const rows = await withTenant(tenantOf(owner), (tx) =>
    tx.shelfCode.findMany({ where: { brandId: owner.brandId }, select: SELECT, orderBy: { label: "asc" } }),
  );
  return rows.map(toView);
}

export async function getShelfCode(owner: Owner, shelfCodeId: string): Promise<ShelfCodeView | null> {
  if (!isUuid(shelfCodeId)) return null;
  const row = await withTenant(tenantOf(owner), (tx) =>
    tx.shelfCode.findFirst({ where: { id: shelfCodeId, brandId: owner.brandId }, select: SELECT }),
  );
  return row ? toView(row) : null;
}
