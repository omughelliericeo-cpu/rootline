// Tests for the trust rules: when a certificate counts, and which badges show.
import { describe, expect, it } from "vitest";
import { getTemplate } from "@/features/industries";
import {
  certificateState,
  daysUntilExpiry,
  isCertificateValid,
  parseScope,
  scopeValue,
  stateLabel,
  visibleBadges,
  type CertificateFacts,
} from "../service";

const TZ = "America/Vancouver";
// 2026-10-24 at 10:00 in Vancouver.
const NOW = new Date("2026-10-24T17:00:00Z");
// @db.Date values come back from Prisma as midnight UTC.
const day = (key: string) => new Date(`${key}T00:00:00Z`);
const cert = (over: Partial<CertificateFacts> = {}): CertificateFacts => ({
  status: "VALID",
  expiresOn: day("2027-06-30"),
  filePath: "brand/certificate/file.pdf",
  ...over,
});

describe("isCertificateValid", () => {
  it("is valid while in date, with a file, and not revoked", () => {
    expect(isCertificateValid(cert(), NOW, TZ)).toBe(true);
  });

  it("stays valid for the whole of its expiry day", () => {
    expect(isCertificateValid(cert({ expiresOn: day("2026-10-24") }), NOW, TZ)).toBe(true);
    // 11:30pm on the expiry day, local time: still valid.
    expect(isCertificateValid(cert({ expiresOn: day("2026-10-24") }), new Date("2026-10-25T06:30:00Z"), TZ)).toBe(true);
  });

  it("stops being valid the day after expiry", () => {
    expect(isCertificateValid(cert({ expiresOn: day("2026-10-23") }), NOW, TZ)).toBe(false);
  });

  it("is never valid once revoked, even if in date", () => {
    expect(isCertificateValid(cert({ status: "REVOKED" }), NOW, TZ)).toBe(false);
  });

  it("is not valid without a file", () => {
    expect(isCertificateValid(cert({ filePath: null }), NOW, TZ)).toBe(false);
  });
});

describe("certificateState", () => {
  it("warns within 30 days of expiry", () => {
    expect(certificateState(cert({ expiresOn: day("2026-11-23") }), NOW, TZ)).toBe("expiring");
    expect(certificateState(cert({ expiresOn: day("2026-11-24") }), NOW, TZ)).toBe("valid");
  });

  it("reports expired, revoked and missing file", () => {
    expect(certificateState(cert({ expiresOn: day("2026-01-01") }), NOW, TZ)).toBe("expired");
    expect(certificateState(cert({ status: "REVOKED", expiresOn: day("2026-01-01") }), NOW, TZ)).toBe("revoked");
    expect(certificateState(cert({ filePath: null }), NOW, TZ)).toBe("missing-file");
  });

  it("counts days until expiry", () => {
    expect(daysUntilExpiry(cert({ expiresOn: day("2026-11-05") }), NOW, TZ)).toBe(12);
  });
});

describe("visibleBadges", () => {
  const allowed = getTemplate("brewery").allowedBadges;

  it("shows only claims with a valid certificate", () => {
    const badges = visibleBadges(
      [
        { ...cert(), claim: "b-corp" },
        { ...cert({ expiresOn: day("2026-01-01") }), claim: "organic" },
        { ...cert({ status: "REVOKED" }), claim: "local-hops" },
      ],
      allowed,
      NOW,
      TZ,
    );
    expect(badges.map((badge) => badge.label)).toEqual(["B Corp"]);
  });

  it("never shows a claim the industry does not allow, even with a valid file", () => {
    expect(visibleBadges([{ ...cert(), claim: "vqa" }], allowed, NOW, TZ)).toEqual([]);
  });

  it("shows each claim once, in the template's order", () => {
    const badges = visibleBadges(
      [
        { ...cert(), claim: "organic" },
        { ...cert(), claim: "b-corp" },
        { ...cert(), claim: "organic" },
      ],
      allowed,
      NOW,
      TZ,
    );
    expect(badges.map((badge) => badge.id)).toEqual(["b-corp", "organic"]);
  });

  it("shows nothing when there are no certificates", () => {
    expect(visibleBadges([], allowed, NOW, TZ)).toEqual([]);
  });
});

describe("stateLabel", () => {
  it("words each state for the producer", () => {
    expect(stateLabel("expiring", 12)).toBe("Expires in 12 days");
    expect(stateLabel("expiring", 1)).toBe("Expires tomorrow");
    expect(stateLabel("expiring", 0)).toBe("Expires today");
    expect(stateLabel("expired", -3)).toBe("Expired");
  });
});

describe("certificate scope", () => {
  const id = "3f2b6a8e-1c4d-4e5f-9a0b-1c2d3e4f5a6b";

  it("parses brand, product and supplier choices", () => {
    expect(parseScope("brand")).toEqual({ productId: null, supplierId: null });
    expect(parseScope(`product:${id}`)).toEqual({ productId: id, supplierId: null });
    expect(parseScope(`supplier:${id}`)).toEqual({ productId: null, supplierId: id });
  });

  it("rejects anything else", () => {
    expect(parseScope("product:not-an-id")).toBeNull();
    expect(parseScope(`batch:${id}`)).toBeNull();
  });

  it("turns a scope back into the form value", () => {
    expect(scopeValue({ productId: id, supplierId: null })).toBe(`product:${id}`);
    expect(scopeValue({ productId: null, supplierId: null })).toBe("brand");
  });
});
