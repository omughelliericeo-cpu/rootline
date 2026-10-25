// Runs before every page, action and API request (Next.js 16 calls
// middleware "proxy"). It:
//  1. gives each request a requestId: on the request headers (for server
//     logs, see src/lib/request-context.ts), the response headers, and a
//     readable cookie (so error screens can show it to the user);
//  2. refreshes the producer's Supabase login session (src/lib/supabase-proxy.ts).
// Access control itself happens in pages and actions (src/lib/auth.ts).
import { NextResponse, type NextRequest } from "next/server";
import { REQUEST_ID_COOKIE, REQUEST_ID_HEADER, newRequestId } from "@/lib/request-id";
import { needsSession, refreshSupabaseSession } from "@/lib/supabase-proxy";

export async function proxy(request: NextRequest) {
  // Always mint our own id; never trust one supplied by the client.
  const requestId = newRequestId();

  // Refresh first: it may update the request's cookies, which the page must see.
  const session = needsSession(request.nextUrl.pathname)
    ? await refreshSupabaseSession(request)
    : { cookies: [], headers: {} };

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(REQUEST_ID_HEADER, requestId);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set(REQUEST_ID_HEADER, requestId);
  response.cookies.set(REQUEST_ID_COOKIE, requestId, { path: "/", sameSite: "lax", httpOnly: false });
  for (const { name, value, options } of session.cookies) response.cookies.set(name, value, options);
  for (const [key, value] of Object.entries(session.headers)) response.headers.set(key, value);
  return response;
}

export const config = {
  // Skip static files and images: they need no requestId and should stay cacheable.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|photos/|.*\\.(?:png|jpg|jpeg|svg|webp|ico)$).*)"],
};
