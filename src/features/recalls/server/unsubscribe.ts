// Unsubscribing by the secret token in an email link (no login needed).
// Kept out of the "use server" file on purpose: every export there becomes
// callable from the browser, and this helper should only run on the server.
import "server-only";
import { db } from "@/lib/db";
import { isUnsubscribeToken } from "../service";

/** Marks the subscriber with this token as unsubscribed. True if the token was valid. */
export async function unsubscribeByToken(token: string): Promise<boolean> {
  if (!isUnsubscribeToken(token)) return false;
  // recall_unsubscribe is a narrow database function (see the recalls migration):
  // it can only mark the subscriber holding this exact token as unsubscribed.
  const rows = await db().$queryRaw<Array<{ ok: boolean }>>`SELECT recall_unsubscribe(${token}) AS ok`;
  return rows[0]?.ok === true;
}
