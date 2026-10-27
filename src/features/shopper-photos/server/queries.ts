// Producer reads: photos waiting for review (shown through short-lived
// private links) and approved ones (public), plus the waiting count for the menu.
import "server-only";
import { batchName } from "@/features/batches";
import { getTemplate } from "@/features/industries";
import { tenantOf, type Owner } from "@/lib/auth";
import { withTenant } from "@/lib/db";
import { publicMediaUrl, signedShopperPhotoUrl } from "@/lib/storage";

export type ReviewPhoto = {
  id: string;
  url: string;
  note: string | null;
  firstName: string | null;
  sharedAt: Date;
  batchId: string;
  batchName: string;
};

export async function listShopperPhotos(owner: Owner): Promise<{ pending: ReviewPhoto[]; approved: ReviewPhoto[] }> {
  const rows = await withTenant(tenantOf(owner), (tx) =>
    tx.shopperPhoto.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
      include: { batch: { select: { id: true, number: true, product: { select: { name: true } } } } },
    }),
  );
  const label = getTemplate(owner.industry).labels.batch;
  const view = async (row: (typeof rows)[number]): Promise<ReviewPhoto> => ({
    id: row.id,
    url: row.status === "PENDING" ? await signedShopperPhotoUrl(row.photoPath) : publicMediaUrl(row.photoPath),
    note: row.note,
    firstName: row.firstName,
    sharedAt: row.createdAt,
    batchId: row.batch.id,
    batchName: batchName(row.batch.product.name, label, row.batch.number),
  });
  const [pending, approved] = await Promise.all([
    Promise.all(rows.filter((row) => row.status === "PENDING").map(view)),
    Promise.all(rows.filter((row) => row.status === "APPROVED").map(view)),
  ]);
  return { pending, approved };
}

export async function pendingShopperPhotoCount(owner: Owner): Promise<number> {
  return withTenant(tenantOf(owner), (tx) => tx.shopperPhoto.count({ where: { status: "PENDING" } }));
}
