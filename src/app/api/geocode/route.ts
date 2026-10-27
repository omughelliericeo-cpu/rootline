// GET /api/geocode?address=...: the "Find on map" lookup, for logged-in
// producers only (so the public cannot use Rootline to query OpenStreetMap).
// A plain request rather than a server action on purpose: Next.js runs a
// page's server actions one at a time, so slow automatic lookups (OpenStreetMap
// allows one per second) would otherwise hold up the producer's Save button.
import { NextResponse, type NextRequest } from "next/server";
import { getOwner } from "@/lib/auth";
import { isAppError } from "@/lib/errors";
import { suggestCoordinates } from "@/lib/geocode-lookup";
import { logger } from "@/lib/logger";
import { getRequestId } from "@/lib/request-context";
import { fail, ok } from "@/lib/result";
import { reportError } from "@/lib/sentry";

export async function GET(request: NextRequest) {
  const requestId = await getRequestId();
  const owner = await getOwner();
  if (!owner) return NextResponse.json(fail("UNAUTHENTICATED", requestId), { status: 401 });

  const address = (request.nextUrl.searchParams.get("address") ?? "").trim();
  if (address.length < 3 || address.length > 200) {
    return NextResponse.json(fail("VALIDATION_FAILED", requestId, "Type the address first."), { status: 400 });
  }

  const started = performance.now();
  const log = { feature: "geocode", action: "suggestCoordinates", requestId, brandId: owner.brandId };
  try {
    const suggestion = await suggestCoordinates(owner, address);
    logger.info("lookup succeeded", { ...log, durationMs: Math.round(performance.now() - started) });
    return NextResponse.json(ok(suggestion));
  } catch (error) {
    const durationMs = Math.round(performance.now() - started);
    if (isAppError(error)) {
      logger.warn("lookup failed", { ...log, durationMs, code: error.code });
      return NextResponse.json(fail(error.code, requestId, error.message), { status: error.code === "GEOCODE_NOT_FOUND" ? 404 : 503 });
    }
    logger.error("lookup crashed", { ...log, durationMs, error });
    reportError(error, { feature: "geocode", action: "suggestCoordinates", requestId, brandId: owner.brandId });
    return NextResponse.json(fail("INTERNAL_ERROR", requestId), { status: 500 });
  }
}
