// Product reads. Row-level security limits them to the owner's brand.
import "server-only";
import { tenantOf, type Owner } from "@/lib/auth";
import { withTenant } from "@/lib/db";
import { isUuid } from "@/lib/ids";
import { publicMediaUrl } from "@/lib/storage";

export type ProductView = {
  id: string;
  name: string;
  format: string;
  ingredients: string[];
  allergens: string[];
  dietaryTags: string[];
  extra: Record<string, unknown>;
  photoUrl: string | null;
};

type ProductRow = Omit<ProductView, "photoUrl" | "extra"> & { extra: unknown; photoPath: string | null };

function toView(row: ProductRow): ProductView {
  const { photoPath, extra, ...rest } = row;
  return {
    ...rest,
    extra: typeof extra === "object" && extra !== null ? (extra as Record<string, unknown>) : {},
    photoUrl: photoPath ? publicMediaUrl(photoPath) : null,
  };
}

const SELECT = {
  id: true,
  name: true,
  format: true,
  ingredients: true,
  allergens: true,
  dietaryTags: true,
  extra: true,
  photoPath: true,
};

export async function listProducts(owner: Owner): Promise<ProductView[]> {
  const rows = await withTenant(tenantOf(owner), (tx) =>
    tx.product.findMany({ where: { brandId: owner.brandId }, select: SELECT, orderBy: { name: "asc" } }),
  );
  return rows.map(toView);
}

/** One product, or null if it does not exist (pages then show "not found"). */
export async function getProduct(owner: Owner, productId: string): Promise<ProductView | null> {
  if (!isUuid(productId)) return null;
  const row = await withTenant(tenantOf(owner), (tx) =>
    tx.product.findFirst({ where: { id: productId, brandId: owner.brandId }, select: SELECT }),
  );
  return row ? toView(row) : null;
}
