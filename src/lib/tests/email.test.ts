// Tests for the email helper: addresses are masked in logs, and log-only mode sends nothing.
import { afterEach, describe, expect, it, vi } from "vitest";
import { maskEmail } from "../email";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("maskEmail", () => {
  it("keeps only the first letter and the domain", () => {
    expect(maskEmail("jess@example.com")).toBe("j***@example.com");
  });
});

describe("sendEmails in log-only mode", () => {
  it("counts every email as handled without calling Resend", async () => {
    vi.stubEnv("EMAIL_PROVIDER", "log");
    vi.stubEnv("DATABASE_URL", "postgresql://unused");
    const { emailReady, sendEmails } = await import("../email");
    expect(emailReady()).toBe(true);
    const summary = await sendEmails(
      [{ to: "a@example.com", subject: "s", text: "t", html: "<p>t</p>" }],
      { idempotencyKey: "k", requestId: "req_0123456789ab", feature: "test" },
    );
    expect(summary).toEqual({ sent: 1, failed: 0 });
  });

  it("is not ready without a Resend key", async () => {
    vi.stubEnv("EMAIL_PROVIDER", "resend");
    vi.stubEnv("RESEND_API_KEY", "");
    vi.stubEnv("DATABASE_URL", "postgresql://unused");
    const { emailReady } = await import("../email");
    expect(emailReady()).toBe(false);
  });
});
