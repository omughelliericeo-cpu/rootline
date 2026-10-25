// Shelf codes (/s/{code}): find the published batch the code points at.
import "server-only";
import { isPublicCode } from "@/lib/codes";
import { withPublic } from "@/lib/db";

/** The batch code a shelf code currently points to, or null (unknown code, no batch, or batch not published). */
export async function batchCodeForShelfCode(shelfCode: string): Promise<string | null> {
  if (!isPublicCode(shelfCode)) return null;
  const found = await withPublic((tx) =>
    tx.shelfCode.findUnique({ where: { code: shelfCode }, select: { batch: { select: { code: true, status: true } } } }),
  );
  const batch = found?.batch;
  return batch && (batch.status === "LIVE" || batch.status === "SOLD_OUT") ? batch.code : null;
}
