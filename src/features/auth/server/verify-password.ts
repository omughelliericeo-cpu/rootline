// Re-checking a logged-in owner's password before a sensitive change (new password,
// deleting the account). Not a server action: it must never be callable from a browser.
import "server-only";
import { createClient } from "@supabase/supabase-js";
import { supabaseConfig } from "@/lib/config";
import { AppError } from "@/lib/errors";
import { authErrorCode } from "../service";

/**
 * Checks a password without touching the browser's session: a separate client that
 * keeps nothing, signed out again (this new session only) straight after.
 */
export async function passwordMatches(email: string, password: string): Promise<boolean> {
  const { url, anonKey } = supabaseConfig();
  const client = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) {
    if (authErrorCode(error) === "AUTH_INVALID_CREDENTIALS") return false;
    throw new AppError(authErrorCode(error), undefined, { cause: error });
  }
  await client.auth.signOut({ scope: "local" }).catch(() => undefined);
  return true;
}
