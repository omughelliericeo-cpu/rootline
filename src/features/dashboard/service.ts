// Dashboard rules: the greeting, and which certificates need attention.
// Pure functions, unit tested.
import { EXPIRING_SOON_DAYS, certificateState, daysUntilExpiry, type CertificateFacts } from "@/features/certificates";
import { hourIn } from "@/lib/dates";

/** "Good morning" before noon, "Good afternoon" until 6pm, then "Good evening", on the brand's clock. */
export function greeting(now: Date, timeZone: string): string {
  const hour = hourIn(now, timeZone);
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export type CertificateAttention<T> = T & { daysLeft: number; expired: boolean };

/**
 * Certificates that expire within the next 30 days, or lapsed in the last 30
 * (not ones revoked on purpose), soonest first. A badge disappears when they
 * lapse, so these are the ones to renew. Older lapses stay listed as
 * "Expired" on the Certificates page instead of filling the dashboard.
 */
export function certificatesNeedingAttention<T extends CertificateFacts>(
  certificates: T[],
  now: Date,
  timeZone: string,
): Array<CertificateAttention<T>> {
  return certificates
    .map((cert) => ({ cert, state: certificateState(cert, now, timeZone), daysLeft: daysUntilExpiry(cert, now, timeZone) }))
    .filter(({ state }) => state === "expiring" || state === "expired")
    .filter(({ daysLeft }) => daysLeft <= EXPIRING_SOON_DAYS && daysLeft >= -EXPIRING_SOON_DAYS)
    .sort((a, b) => a.daysLeft - b.daysLeft)
    .map(({ cert, daysLeft, state }) => ({ ...cert, daysLeft, expired: state === "expired" }));
}

/** "Expires today", "Expires in 12 days", "Expired 3 days ago". */
export function daysLeftLabel(daysLeft: number): string {
  if (daysLeft < 0) return daysLeft === -1 ? "Expired yesterday" : `Expired ${-daysLeft} days ago`;
  if (daysLeft === 0) return "Expires today";
  if (daysLeft === 1) return "Expires tomorrow";
  return `Expires in ${daysLeft} days`;
}
