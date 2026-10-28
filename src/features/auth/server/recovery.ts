// The signed "recovery" cookie set when a password reset link is opened (see service.ts).
import "server-only";
import { cookies } from "next/headers";
import { supabaseConfig } from "@/lib/config";
import { RECOVERY_COOKIE, RECOVERY_MINUTES, isValidRecoveryToken, recoveryToken } from "../service";

const secret = () => supabaseConfig().serviceRoleKey;

export function recoveryCookie(userId: string) {
  return {
    name: RECOVERY_COOKIE,
    value: recoveryToken(userId, Date.now(), secret()),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: RECOVERY_MINUTES * 60,
  };
}

export async function hasRecoveryCookie(userId: string): Promise<boolean> {
  const token = (await cookies()).get(RECOVERY_COOKIE)?.value;
  return isValidRecoveryToken(token, userId, Date.now(), secret());
}

export async function clearRecoveryCookie(): Promise<void> {
  (await cookies()).delete(RECOVERY_COOKIE);
}
