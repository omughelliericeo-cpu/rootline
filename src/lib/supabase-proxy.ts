// Keeps a producer's login session fresh. Supabase access tokens expire after
// an hour; calling getUser() here refreshes them and writes the new cookies
// onto the response before any page renders. Used only by src/proxy.ts.
import { createServerClient } from "@supabase/ssr";
import type { NextRequest } from "next/server";

export type SessionCookies = {
  cookies: Array<{ name: string; value: string; options: Record<string, unknown> }>;
  headers: Record<string, string>;
};

/** Paths that never need a session: public shopper pages and the health check. */
const PUBLIC_PREFIXES = ["/b/", "/s/", "/api/health", "/recall/", "/api/recall/"];

export function needsSession(pathname: string): boolean {
  return !PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

/**
 * Refreshes the session and returns any cookies Supabase wants to set. The
 * refreshed cookies are also written onto `request`, so the page rendered for
 * this same request sees the new session.
 */
export async function refreshSupabaseSession(request: NextRequest): Promise<SessionCookies> {
  const result: SessionCookies = { cookies: [], headers: {} };
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return result; // not configured yet: nothing to refresh

  // No Supabase cookie means nobody is logged in: skip the network call.
  if (!request.cookies.getAll().some((cookie) => cookie.name.startsWith("sb-"))) return result;

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet, headers) => {
        for (const cookie of cookiesToSet) request.cookies.set(cookie.name, cookie.value);
        result.cookies.push(...cookiesToSet);
        Object.assign(result.headers, headers);
      },
    },
  });
  await supabase.auth.getUser();
  return result;
}
