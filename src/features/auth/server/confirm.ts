// Handles the links in Supabase's emails (GET /auth/confirm): "confirm your email"
// and "reset your password". Supabase sends either ?code=... (its default email
// templates) or ?token_hash=...&type=... (the templates recommended in the README,
// which also work when the link is opened on a different device).
// A reset link also gets the signed recovery cookie (see service.ts).
import "server-only";
import type { EmailOtpType } from "@supabase/supabase-js";
import { logger } from "@/lib/logger";
import { getRequestId } from "@/lib/request-context";
import { supabaseServer } from "@/lib/supabase";
import { afterConfirmPath, isRecoveryLink } from "../service";
import { recoveryCookie } from "./recovery";

const OTP_TYPES = new Set<EmailOtpType>(["email", "signup", "magiclink", "recovery", "invite", "email_change"]);

export type ConfirmOutcome =
  | { ok: true; destination: string; cookie: ReturnType<typeof recoveryCookie> | null }
  | { ok: false; destination: string };

export async function confirmEmailFromLink(params: URLSearchParams): Promise<ConfirmOutcome> {
  const requestId = await getRequestId();
  const supabase = await supabaseServer();
  const code = params.get("code");
  const tokenHash = params.get("token_hash");
  const type = params.get("type");
  const next = params.get("next");
  const recovery = isRecoveryLink(type, next);

  let error: unknown = new Error("Link has no code or token_hash");
  let userId: string | undefined;
  if (tokenHash && type && OTP_TYPES.has(type as EmailOtpType)) {
    const result = await supabase.auth.verifyOtp({ type: type as EmailOtpType, token_hash: tokenHash });
    error = result.error;
    userId = result.data.user?.id;
  } else if (code) {
    const result = await supabase.auth.exchangeCodeForSession(code);
    error = result.error;
    userId = result.data.user?.id;
  }

  const action = recovery ? "openResetLink" : "confirmEmail";
  if (error || !userId) {
    logger.warn(recovery ? "password reset link failed" : "email confirmation failed", { feature: "auth", action, requestId, error });
    return { ok: false, destination: recovery ? "/forgot-password?error=expired" : "/login?error=confirm" };
  }
  logger.info(recovery ? "password reset link opened" : "email confirmed", { feature: "auth", action, requestId });
  return { ok: true, destination: afterConfirmPath(recovery ? "recovery" : type, next), cookie: recovery ? recoveryCookie(userId) : null };
}
