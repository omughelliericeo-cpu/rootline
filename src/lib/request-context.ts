// Server-side access to the current request's id (set by src/proxy.ts).
import "server-only";
import { headers } from "next/headers";
import { REQUEST_ID_HEADER, isValidRequestId, newRequestId } from "./request-id";

export async function getRequestId(): Promise<string> {
  try {
    const value = (await headers()).get(REQUEST_ID_HEADER);
    // Falls back to a fresh id for code paths the proxy does not cover (e.g. scripts).
    return isValidRequestId(value) ? value : newRequestId();
  } catch {
    // headers() throws outside a request (seed scripts, tests).
    return newRequestId();
  }
}
