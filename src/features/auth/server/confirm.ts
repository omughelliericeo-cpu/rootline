// Handles the link in the "confirm your email" message (GET /auth/confirm).
// Supabase sends either ?code=... (its default email template) or
// ?token_hash=...&type=email (the template recommended in the README, which
// also works when the link is opened on a different device).
import "server-only";
import type { EmailOtpType } from "@supabase/supabase-js";
import { logger } from "@/lib/logger";
import { getRequestId } from "@/lib/request-context";
import { supabaseServer } from "@/lib/supabase";

const OTP_TYPES = new Set<EmailOtpType>(["email", "signup", "magiclink", "recovery", "invite", "email_change"]);

export async function confirmEmailFromLink(params: URLSearchParams): Promise<boolean> {
  const requestId = await getRequestId();
  const supabase = await supabaseServer();
  const code = params.get("code");
  const tokenHash = params.get("token_hash");
  const type = params.get("type") as EmailOtpType | null;

  let error: unknown = new Error("Link has no code or token_hash");
  if (tokenHash && type && OTP_TYPES.has(type)) {
    ({ error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash }));
  } else if (code) {
    ({ error } = await supabase.auth.exchangeCodeForSession(code));
  }

  if (error) {
    logger.warn("email confirmation failed", { feature: "auth", action: "confirmEmail", requestId, error });
    return false;
  }
  logger.info("email confirmed", { feature: "auth", action: "confirmEmail", requestId });
  return true;
}
