// Tests for the dashboard's greeting and certificate reminders.
import { describe, expect, it } from "vitest";
import { certificatesNeedingAttention, daysLeftLabel, greeting } from "../service";

const TZ = "America/Vancouver";
const day = (key: string) => new Date(`${key}T00:00:00Z`);
const NOW = new Date("2026-10-24T17:00:00Z"); // 10am in Vancouver

describe("greeting", () => {
  it("follows the brand's clock", () => {
    expect(greeting(new Date("2026-10-24T15:00:00Z"), TZ)).toBe("Good morning"); // 8am
    expect(greeting(new Date("2026-10-24T21:00:00Z"), TZ)).toBe("Good afternoon"); // 2pm
    expect(greeting(new Date("2026-10-25T03:00:00Z"), TZ)).toBe("Good evening"); // 8pm
  });
});

describe("certificatesNeedingAttention", () => {
  const cert = (id: string, expires: string, status: "VALID" | "REVOKED" = "VALID") => ({ id, status, expiresOn: day(expires), filePath: "x.pdf" });

  it("lists expired and soon-expiring certificates, soonest first", () => {
    const result = certificatesNeedingAttention(
      [cert("later", "2027-06-01"), cert("soon", "2026-11-05"), cert("lapsed", "2026-10-20"), cert("today", "2026-10-24")],
      NOW,
      TZ,
    );
    expect(result.map((item) => [item.id, item.daysLeft, item.expired])).toEqual([
      ["lapsed", -4, true],
      ["today", 0, false],
      ["soon", 12, false],
    ]);
  });

  it("leaves out revoked certificates (they were withdrawn on purpose)", () => {
    expect(certificatesNeedingAttention([cert("gone", "2026-10-30", "REVOKED")], NOW, TZ)).toEqual([]);
  });

  it("leaves out long-expired certificates", () => {
    expect(certificatesNeedingAttention([cert("old", "2025-01-01")], NOW, TZ)).toEqual([]);
  });
});

describe("daysLeftLabel", () => {
  it("words the days left", () => {
    expect(daysLeftLabel(12)).toBe("Expires in 12 days");
    expect(daysLeftLabel(1)).toBe("Expires tomorrow");
    expect(daysLeftLabel(0)).toBe("Expires today");
    expect(daysLeftLabel(-1)).toBe("Expired yesterday");
    expect(daysLeftLabel(-4)).toBe("Expired 4 days ago");
  });
});
