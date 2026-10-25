// The trust rules. A claim becomes a badge only while its certificate is
// VALID, has a file, and has not passed its expiry date. This is worked out
// every time from these functions and never stored as a flag.
import { dateKeyIn, daysBetweenKeys, storedDateKey } from "@/lib/dates";

/** Within this many days of expiry the producer is warned (dashboard, list). */
export const EXPIRING_SOON_DAYS = 30;

export type CertificateFacts = {
  status: "VALID" | "REVOKED";
  /** Last valid day (inclusive), from a @db.Date column. */
  expiresOn: Date;
  filePath: string | null;
};

export type CertificateState = "valid" | "expiring" | "expired" | "revoked" | "missing-file";

/** Days from today (in the brand's time zone) to the expiry date; 0 = expires today. */
export function daysUntilExpiry(cert: Pick<CertificateFacts, "expiresOn">, now: Date, timeZone: string): number {
  return daysBetweenKeys(dateKeyIn(now, timeZone), storedDateKey(cert.expiresOn));
}

export function certificateState(cert: CertificateFacts, now: Date, timeZone: string): CertificateState {
  if (cert.status === "REVOKED") return "revoked";
  if (!cert.filePath) return "missing-file";
  const days = daysUntilExpiry(cert, now, timeZone);
  if (days < 0) return "expired";
  return days <= EXPIRING_SOON_DAYS ? "expiring" : "valid";
}

/** The rule behind every badge. Valid through the whole of its expiry day. */
export function isCertificateValid(cert: CertificateFacts, now: Date, timeZone: string): boolean {
  const state = certificateState(cert, now, timeZone);
  return state === "valid" || state === "expiring";
}

export type Badge = { id: string; label: string };

/**
 * Badges to show for a set of certificates: only valid ones, only claims the
 * industry template allows, each claim once, in the template's order.
 */
export function visibleBadges(
  certificates: Array<CertificateFacts & { claim: string }>,
  allowedBadges: Badge[],
  now: Date,
  timeZone: string,
): Badge[] {
  const provenClaims = new Set(
    certificates.filter((cert) => isCertificateValid(cert, now, timeZone)).map((cert) => cert.claim),
  );
  return allowedBadges.filter((badge) => provenClaims.has(badge.id));
}

/** Short status text for the producer, e.g. "Expires in 12 days". */
export function stateLabel(state: CertificateState, daysLeft: number): string {
  switch (state) {
    case "revoked":
      return "Revoked";
    case "missing-file":
      return "File missing";
    case "expired":
      return "Expired";
    case "expiring":
      return daysLeft === 0 ? "Expires today" : daysLeft === 1 ? "Expires tomorrow" : `Expires in ${daysLeft} days`;
    case "valid":
      return "Valid";
  }
}

export type CertificateScope = { productId: string | null; supplierId: string | null };

const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
const SCOPE = new RegExp(`^(brand|product:(${UUID})|supplier:(${UUID}))$`, "i");

/** The "Applies to" choice: "brand", "product:<id>" or "supplier:<id>". Null if malformed. */
export function parseScope(value: string): CertificateScope | null {
  const match = SCOPE.exec(value);
  if (!match) return null;
  return { productId: match[2] ?? null, supplierId: match[3] ?? null };
}

export function scopeValue(scope: CertificateScope): string {
  if (scope.productId) return `product:${scope.productId}`;
  if (scope.supplierId) return `supplier:${scope.supplierId}`;
  return "brand";
}
