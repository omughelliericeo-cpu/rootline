// Auth rules: translating Supabase errors into our error codes, spotting a
// repeat sign-up, and keeping post-login redirects on our own site.
import { createHmac, timingSafeEqual } from "node:crypto";
import type { ErrorCode } from "@/lib/errors";

type SupabaseAuthError = { code?: string; status?: number; message?: string };

/** Supabase error codes -> Rootline error codes (unknown ones become INTERNAL_ERROR). */
export function authErrorCode(error: SupabaseAuthError): ErrorCode {
  switch (error.code) {
    case "invalid_credentials":
      return "AUTH_INVALID_CREDENTIALS";
    case "email_not_confirmed":
      return "AUTH_EMAIL_NOT_CONFIRMED";
    case "user_already_exists":
    case "email_exists":
      return "AUTH_EMAIL_TAKEN";
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return "AUTH_RATE_LIMITED";
    case "same_password":
      return "AUTH_SAME_PASSWORD";
    case "weak_password":
    case "email_address_invalid":
    case "validation_failed":
      return "VALIDATION_FAILED";
    case "otp_expired":
    case "flow_state_expired":
    case "bad_code_verifier":
      return "AUTH_CONFIRM_FAILED";
  }
  return error.status === 429 ? "AUTH_RATE_LIMITED" : "INTERNAL_ERROR";
}

/**
 * When an email is already registered and confirmed, Supabase still answers
 * sign-up "successfully" (so outsiders cannot test which emails exist) but
 * returns a user with no identities. That is how we tell it apart.
 */
export function isRepeatSignUp(user: { identities?: unknown[] | null }): boolean {
  return Array.isArray(user.identities) && user.identities.length === 0;
}

export const DEFAULT_AFTER_LOGIN = "/dashboard";

/**
 * Only same-site paths are allowed after login ("/brand", not
 * "https://evil.example" or "//evil.example"), so a crafted login link
 * cannot send someone to another site.
 */
export function safeNextPath(next: unknown): string {
  if (typeof next !== "string" || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) {
    return DEFAULT_AFTER_LOGIN;
  }
  return next;
}

// ---- Password reset ----
// Opening a reset link logs the owner in. The confirm route then sets a short-lived,
// signed "recovery" cookie, and only a session carrying it may set a new password
// without typing the current one. Otherwise anyone at an unlocked, logged-in computer
// could change the password without proving they own the email address.

export const RECOVERY_COOKIE = "rootline_recovery";
export const RECOVERY_MINUTES = 30;

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

/** "{userId}.{expiresAtMs}.{signature}" */
export function recoveryToken(userId: string, now: number, secret: string): string {
  const payload = `${userId}.${now + RECOVERY_MINUTES * 60_000}`;
  return `${payload}.${sign(payload, secret)}`;
}

export function isValidRecoveryToken(token: string | undefined, userId: string, now: number, secret: string): boolean {
  if (!token) return false;
  const [tokenUser, expiresAt, signature, ...rest] = token.split(".");
  if (rest.length > 0 || !tokenUser || !expiresAt || !signature) return false;
  if (tokenUser !== userId || !(Number(expiresAt) > now)) return false;
  const expected = Buffer.from(sign(`${tokenUser}.${expiresAt}`, secret));
  const given = Buffer.from(signature);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

/** Where the confirm link goes once it has logged the owner in. */
export function afterConfirmPath(type: string | null, next: string | null): string {
  if (type === "recovery") return "/reset-password";
  return safeNextPath(next ?? undefined);
}

/** A reset link: the email template's type=recovery, or the redirect the reset request asked for. */
export function isRecoveryLink(type: string | null, next: string | null): boolean {
  return type === "recovery" || next === "/reset-password";
}
