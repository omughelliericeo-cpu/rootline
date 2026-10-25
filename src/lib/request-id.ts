// Request IDs: one short id per incoming request, created in src/proxy.ts.
// It travels in a request header (for server code), a response header, and a
// readable cookie (so error screens in the browser can show it to the user).
// This file has no server-only imports so the proxy and the browser can use it.

export const REQUEST_ID_HEADER = "x-request-id";
export const REQUEST_ID_COOKIE = "rl_rid";

/** Short enough to read out over the phone, long enough to be unique in logs. */
export function newRequestId(): string {
  return "req_" + crypto.randomUUID().replace(/-/g, "").slice(0, 12);
}

/** Accept an incoming id only if it looks like one of ours, so logs stay clean. */
export function isValidRequestId(value: string | null | undefined): value is string {
  return typeof value === "string" && /^req_[a-f0-9]{12}$/.test(value);
}

/** Browser-side: the id of the most recent request, read from the cookie. */
export function readRequestIdFromCookie(cookieString: string): string | undefined {
  const match = cookieString.split("; ").find((part) => part.startsWith(REQUEST_ID_COOKIE + "="));
  const value = match?.slice(REQUEST_ID_COOKIE.length + 1);
  return isValidRequestId(value) ? value : undefined;
}
