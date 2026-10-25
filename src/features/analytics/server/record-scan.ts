// Records one scan of a story page. Runs after the page has been sent (via
// next/server `after`), so a slow or failed insert never delays the shopper.
import "server-only";
import { withPublic } from "@/lib/db";
import { logger } from "@/lib/logger";
import { coarseLocation } from "../service";

type ScanInput = { batchId: string; via: "BATCH" | "SHELF"; headers: Headers; requestId: string };

export async function recordScan({ batchId, via, headers, requestId }: ScanInput): Promise<void> {
  try {
    // createMany, not create: create reads the new row back, and the public is
    // (deliberately) not allowed to read scans. Scans are write-only for them.
    await withPublic((tx) => tx.scanEvent.createMany({ data: [{ batchId, via, ...coarseLocation(headers) }] }));
  } catch (error) {
    // Losing one count is better than failing the page; log it so it can be noticed.
    logger.warn("scan not recorded", { feature: "analytics", action: "recordScan", requestId, batchId, error });
  }
}
