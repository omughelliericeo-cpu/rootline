// Tests for auth rules: error mapping, repeat sign-ups and safe redirects.
import { describe, expect, it } from "vitest";
import { authErrorCode, isRepeatSignUp, safeNextPath } from "../service";

describe("authErrorCode", () => {
  it("maps Supabase codes to Rootline codes", () => {
    expect(authErrorCode({ code: "invalid_credentials" })).toBe("AUTH_INVALID_CREDENTIALS");
    expect(authErrorCode({ code: "email_not_confirmed" })).toBe("AUTH_EMAIL_NOT_CONFIRMED");
    expect(authErrorCode({ code: "user_already_exists" })).toBe("AUTH_EMAIL_TAKEN");
    expect(authErrorCode({ code: "over_email_send_rate_limit" })).toBe("AUTH_RATE_LIMITED");
    expect(authErrorCode({ code: "weak_password" })).toBe("VALIDATION_FAILED");
    expect(authErrorCode({ code: "otp_expired" })).toBe("AUTH_CONFIRM_FAILED");
  });

  it("treats HTTP 429 as rate limiting and anything else unknown as internal", () => {
    expect(authErrorCode({ status: 429 })).toBe("AUTH_RATE_LIMITED");
    expect(authErrorCode({ code: "something_new", status: 500 })).toBe("INTERNAL_ERROR");
  });
});

describe("isRepeatSignUp", () => {
  it("spots the empty-identities user Supabase returns for an existing email", () => {
    expect(isRepeatSignUp({ identities: [] })).toBe(true);
  });

  it("does not flag a genuinely new user", () => {
    expect(isRepeatSignUp({ identities: [{ provider: "email" }] })).toBe(false);
    expect(isRepeatSignUp({})).toBe(false);
  });
});

describe("safeNextPath", () => {
  it("keeps same-site paths", () => {
    expect(safeNextPath("/brand")).toBe("/brand");
    expect(safeNextPath("/batches/new?step=2")).toBe("/batches/new?step=2");
  });

  it("refuses other sites and odd values", () => {
    expect(safeNextPath("https://evil.example")).toBe("/dashboard");
    expect(safeNextPath("//evil.example")).toBe("/dashboard");
    expect(safeNextPath("/\\evil.example")).toBe("/dashboard");
    expect(safeNextPath(undefined)).toBe("/dashboard");
  });
});
