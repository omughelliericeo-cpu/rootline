"use server";
// Forgot password, choosing a new one from the reset link, and changing it while
// logged in. Supabase stores the password; Rootline never sees it after the request.
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { defineAction, defineOwnerAction } from "@/lib/action";
import { getSessionUser } from "@/lib/auth";
import { serverConfig } from "@/lib/config";
import { maskEmail } from "@/lib/email";
import { AppError, ValidationError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { createRateLimiter } from "@/lib/rate-limit";
import { supabaseServer } from "@/lib/supabase";
import { changePasswordSchema, forgotPasswordSchema, setNewPasswordSchema, type ForgotPasswordResult } from "../schema";
import { authErrorCode } from "../service";
import { clearRecoveryCookie, hasRecoveryCookie } from "./recovery";
import { passwordMatches } from "./verify-password";

// Supabase also limits reset emails; this stops one visitor asking for many addresses.
const resetRequests = createRateLimiter({ limit: 5, windowMs: 15 * 60_000 });

export const requestPasswordReset = defineAction({
  feature: "auth",
  action: "requestPasswordReset",
  input: forgotPasswordSchema,
  handler: async ({ email }, ctx): Promise<ForgotPasswordResult> => {
    const visitor = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (!resetRequests.allow(visitor)) throw new AppError("AUTH_RATE_LIMITED");

    const supabase = await supabaseServer();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${serverConfig().APP_URL.replace(/\/+$/, "")}/auth/confirm?next=/reset-password`,
    });
    if (error) {
      const code = authErrorCode(error);
      if (code === "AUTH_RATE_LIMITED") throw new AppError(code, undefined, { cause: error });
      // Any other failure gets the same answer as success, so the form never reveals
      // whether an address has an account.
      logger.warn("password reset email not sent", { feature: "auth", action: "requestPasswordReset", requestId: ctx.requestId, to: maskEmail(email), error });
    }
    return { status: "sent", email };
  },
});

/** From the reset link: allowed only while the signed recovery cookie is valid. */
export const setNewPassword = defineAction({
  feature: "auth",
  action: "setNewPassword",
  input: setNewPasswordSchema,
  handler: async ({ password }) => {
    const user = await getSessionUser();
    if (!user || !(await hasRecoveryCookie(user.id))) throw new AppError("AUTH_RESET_EXPIRED");
    await updatePassword(password);
    await clearRecoveryCookie();
    redirect("/account?notice=password");
  },
});

export const changePassword = defineOwnerAction({
  feature: "auth",
  action: "changePassword",
  input: changePasswordSchema,
  handler: async ({ currentPassword, password }, { owner }) => {
    if (!(await passwordMatches(owner.email, currentPassword))) {
      throw new ValidationError({ currentPassword: ["That isn't your current password"] });
    }
    await updatePassword(password);
    redirect("/account?notice=password");
  },
});

async function updatePassword(password: string) {
  const supabase = await supabaseServer();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    const code = authErrorCode(error);
    if (code === "AUTH_SAME_PASSWORD" || code === "VALIDATION_FAILED") {
      throw new ValidationError({ password: [code === "AUTH_SAME_PASSWORD" ? "Choose a password different from your current one" : "Choose a stronger password"] });
    }
    throw new AppError(code, undefined, { cause: error });
  }
}
