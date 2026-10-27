// Scan counts for the producer. Days are calendar days in the brand's time
// zone, counted in the database. Everything runs through withTenant, so
// row-level security limits it to the owner's own batches.
//
// Time zones: Prisma stores DateTime as UTC in "timestamp without time zone"
// columns. So a stored time is first marked as UTC, then converted to the
// brand's zone: (scanned_at AT TIME ZONE 'UTC') AT TIME ZONE tz. A JavaScript
// Date parameter arrives as UTC wall-clock text with no zone, so it is compared
// as `${date}::timestamp`. (Casting it to timestamptz would read it in the
// database session's time zone, which is UTC on Supabase but local elsewhere.)
import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { tenantOf, type Owner } from "@/lib/auth";
import { addDaysToKey, dateKeyIn, zonedDateTime } from "@/lib/dates";
import { withTenant } from "@/lib/db";
import { fillDays, type DayCount } from "../service";

/** Daily scan counts for the last `days` days, ending today, optionally for one batch. */
export async function scansByDay(owner: Owner, now: Date, days: number, batchId?: string): Promise<DayCount[]> {
  const today = dateKeyIn(now, owner.timezone);
  const since = zonedDateTime(addDaysToKey(today, -(days - 1)), "00:00", owner.timezone);
  const onlyBatch = batchId ? Prisma.sql`AND s.batch_id = ${batchId}::uuid` : Prisma.empty;
  const rows = await withTenant(tenantOf(owner), (tx) =>
    tx.$queryRaw<DayCount[]>`
      SELECT to_char(((s.scanned_at AT TIME ZONE 'UTC') AT TIME ZONE ${owner.timezone})::date, 'YYYY-MM-DD') AS day,
             count(*)::int AS count
      FROM scan_event s
      JOIN batch b ON b.id = s.batch_id
      WHERE b.brand_id = ${owner.brandId}::uuid AND s.scanned_at >= ${since}::timestamp ${onlyBatch}
      GROUP BY 1`,
  );
  return fillDays(rows, today, days);
}

export type BatchScanCount = { batchId: string; productName: string; number: number; count: number };

/** The most-scanned batches since `since`, most first. */
export async function topBatchesByScans(owner: Owner, since: Date, limit: number): Promise<BatchScanCount[]> {
  return withTenant(tenantOf(owner), (tx) =>
    tx.$queryRaw<BatchScanCount[]>`
      SELECT b.id AS "batchId", p.name AS "productName", b.number, count(*)::int AS count
      FROM scan_event s
      JOIN batch b ON b.id = s.batch_id
      JOIN product p ON p.id = b.product_id
      WHERE b.brand_id = ${owner.brandId}::uuid AND s.scanned_at >= ${since}::timestamp
      GROUP BY b.id, p.name, b.number
      ORDER BY count DESC, b.number DESC
      LIMIT ${limit}`,
  );
}

/** All-time scan totals for the given batches (missing = 0). */
export async function totalScans(owner: Owner, batchIds: string[]): Promise<Map<string, number>> {
  if (batchIds.length === 0) return new Map();
  const rows = await withTenant(tenantOf(owner), (tx) =>
    tx.scanEvent.groupBy({ by: ["batchId"], where: { batchId: { in: batchIds } }, _count: { _all: true } }),
  );
  return new Map(rows.map((row) => [row.batchId, row._count._all]));
}
