// Supabase clients for server code.
//  - supabaseServer(): acts as the logged-in user; reads/writes the session
//    cookies. Use for sign-up, login, logout and "who is this?".
//  - supabaseAdmin(): uses the service-role key and bypasses Supabase's own
//    checks. Use only for storage uploads and admin tasks, never with
//    user-supplied paths.
import "server-only";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { supabaseConfig } from "./config";

export async function supabaseServer() {
  const { url, anonKey } = supabaseConfig();
  const cookieStore = await cookies();
  return createServerClient(url, anonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        try {
          for (const { name, value, options } of cookiesToSet) cookieStore.set(name, value, options);
        } catch {
          // Server Components cannot set cookies; the proxy refreshes the session instead.
        }
      },
    },
  });
}

let admin: ReturnType<typeof createClient> | undefined;

export function supabaseAdmin() {
  const { url, serviceRoleKey } = supabaseConfig();
  admin ??= createClient(url, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
  return admin;
}
