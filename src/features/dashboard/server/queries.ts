// Everything the producer dashboard shows, gathered in one place. Each part
// comes from its own feature (analytics, recalls, certificates, batches).
import "server-only";
import { scansByDay, topBatchesByScans, totalScans, weekTotals, percentChange, type BatchScanCount, type DayCount } from "@/features/analytics";
import { batchName, countBatches, listBatches, type BatchSummary } from "@/features/batches";
import { listCertificates, type CertificateView } from "@/features/certificates";
import { getTemplate, optionLabel } from "@/features/industries";
import { recallTotals, type RecallTotals } from "@/features/recalls";
import type { Owner } from "@/lib/auth";
import { addDaysToKey, dateKeyIn, zonedDateTime } from "@/lib/dates";
import { certificatesNeedingAttention, greeting, type CertificateAttention } from "../service";

export type DashboardData = {
  greeting: string;
  scans: { days: DayCount[]; thisWeek: number; change: string | null };
  topBatches: Array<BatchScanCount & { name: string }>;
  recalls: RecallTotals;
  certificates: Array<CertificateAttention<CertificateView> & { claimLabel: string }>;
  recentBatches: Array<BatchSummary & { name: string; scans: number }>;
  liveBatches: number;
};

export async function getDashboard(owner: Owner, now: Date): Promise<DashboardData> {
  const template = getTemplate(owner.industry);
  const today = dateKeyIn(now, owner.timezone);
  const startOfDay = (daysAgo: number) => zonedDateTime(addDaysToKey(today, -daysAgo), "00:00", owner.timezone);
  const nameOf = (productName: string, number: number) => batchName(productName, template.labels.batch, number);

  const [days, top, recalls, certificates, recent, liveBatches] = await Promise.all([
    scansByDay(owner, now, 14),
    topBatchesByScans(owner, startOfDay(29), 5),
    recallTotals(owner, startOfDay(6)),
    listCertificates(owner),
    listBatches(owner, { limit: 6 }),
    countBatches(owner, "LIVE"),
  ]);
  const scanTotals = await totalScans(owner, recent.map((batch) => batch.id));
  const { thisWeek, lastWeek } = weekTotals(days);

  return {
    greeting: greeting(now, owner.timezone),
    scans: { days, thisWeek, change: percentChange(thisWeek, lastWeek) },
    topBatches: top.map((row) => ({ ...row, name: nameOf(row.productName, row.number) })),
    recalls,
    certificates: certificatesNeedingAttention(certificates, now, owner.timezone).map((cert) => ({
      ...cert,
      claimLabel: optionLabel(template.allowedBadges, cert.claim),
    })),
    liveBatches,
    recentBatches: recent.map((batch) => ({ ...batch, name: nameOf(batch.productName, batch.number), scans: scanTotals.get(batch.id) ?? 0 })),
  };
}
