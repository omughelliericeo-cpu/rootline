// POST /api/recall/unsubscribe/{token}: "one-click" unsubscribe (RFC 8058).
// Mail apps call this when someone presses their built-in Unsubscribe button,
// using the List-Unsubscribe headers on every recall email. POST only: a GET
// (e.g. a link scanner) never unsubscribes anyone.
import { NextResponse, type NextRequest } from "next/server";
import { unsubscribeByToken } from "@/features/recalls";
import { logger } from "@/lib/logger";
import { getRequestId } from "@/lib/request-context";

export async function POST(_request: NextRequest, { params }: RouteContext<"/api/recall/unsubscribe/[token]">) {
  const { token } = await params;
  const ok = await unsubscribeByToken(token);
  logger.info("one-click unsubscribe", { feature: "recalls", action: "oneClickUnsubscribe", requestId: await getRequestId(), ok });
  return new NextResponse(ok ? "Unsubscribed" : "Unknown link", { status: ok ? 200 : 404 });
}
