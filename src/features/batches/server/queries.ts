// Batch reads for the producer. Row-level security limits them to the owner's brand.
import "server-only";
import { tenantOf, type Owner } from "@/lib/auth";
import { storedDateKey } from "@/lib/dates";
import { withTenant } from "@/lib/db";
import { isUuid } from "@/lib/ids";
import type { BatchStatus, LotDraft, StopDraft } from "../service";
import { nextBatchNumber } from "../service";

export type BatchSummary = {
  id: string;
  code: string;
  number: number;
  status: BatchStatus;
  productId: string;
  productName: string;
  madeAt: Date;
  packagedAt: Date | null;
};

export type BatchDetail = BatchSummary & {
  extra: Record<string, unknown>;
  publishedAt: Date | null;
  lots: Array<LotDraft & { supplierName: string }>;
  stops: StopDraft[];
};

type StopRow = Omit<StopDraft, "arrivedOn"> & { arrivedOn: Date | null };

/** A database stop -> the shape forms and rules use. */
export function toStopDraft({ name, type, address, latitude, longitude, arrivedOn, note }: StopRow): StopDraft {
  return { name, type, address, latitude, longitude, note, arrivedOn: arrivedOn ? storedDateKey(arrivedOn) : null };
}

const SUMMARY = {
  id: true,
  code: true,
  number: true,
  status: true,
  productId: true,
  madeAt: true,
  packagedAt: true,
  product: { select: { name: true } },
} as const;

export async function listBatches(owner: Owner, options: { limit?: number } = {}): Promise<BatchSummary[]> {
  const rows = await withTenant(tenantOf(owner), (tx) =>
    tx.batch.findMany({
      where: { brandId: owner.brandId },
      select: SUMMARY,
      orderBy: { createdAt: "desc" },
      take: options.limit,
    }),
  );
  return rows.map(({ product, ...row }) => ({ ...row, productName: product.name }));
}

/** One batch with its lots and stops, or null if it is not this brand's. */
/** How many of the brand's batches have this status (e.g. LIVE for the dashboard). */
export async function countBatches(owner: Owner, status: BatchStatus): Promise<number> {
  return withTenant(tenantOf(owner), (tx) => tx.batch.count({ where: { status } }));
}

export async function getBatch(owner: Owner, batchId: string): Promise<BatchDetail | null> {
  if (!isUuid(batchId)) return null;
  const row = await withTenant(tenantOf(owner), (tx) =>
    tx.batch.findFirst({
      where: { id: batchId, brandId: owner.brandId },
      select: {
        ...SUMMARY,
        extra: true,
        publishedAt: true,
        lots: { orderBy: { position: "asc" }, include: { supplier: { select: { name: true } } } },
        stops: { orderBy: { position: "asc" } },
      },
    }),
  );
  if (!row) return null;
  const { product, lots, stops, extra, ...rest } = row;
  return {
    ...rest,
    productName: product.name,
    extra: typeof extra === "object" && extra !== null ? (extra as Record<string, unknown>) : {},
    lots: lots.map((lot) => ({
      supplierId: lot.supplierId,
      ingredient: lot.ingredient,
      lotNumber: lot.lotNumber,
      supplierName: lot.supplier.name,
    })),
    stops: stops.map(toStopDraft),
  };
}

/** The number the next batch of this product would get. */
export async function suggestedBatchNumber(owner: Owner, productId: string): Promise<number> {
  if (!isUuid(productId)) return 1;
  const rows = await withTenant(tenantOf(owner), (tx) =>
    tx.batch.findMany({ where: { brandId: owner.brandId, productId }, select: { number: true } }),
  );
  return nextBatchNumber(rows.map((row) => row.number));
}
