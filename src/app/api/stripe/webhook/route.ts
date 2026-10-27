// POST /api/stripe/webhook: Stripe tells Rootline when a subscription starts,
// changes or ends. The signature is checked with STRIPE_WEBHOOK_SECRET, so
// nobody else can change a brand's plan through this route.
import { NextResponse, type NextRequest } from "next/server";
import { handleStripeEvent, stripeClient } from "@/features/billing";
import { serverConfig } from "@/lib/config";
import { logger } from "@/lib/logger";
import { getRequestId } from "@/lib/request-context";
import { reportError } from "@/lib/sentry";

export async function POST(request: NextRequest) {
  const requestId = await getRequestId();
  const client = stripeClient();
  const secret = serverConfig().STRIPE_WEBHOOK_SECRET;
  if (!client || !secret) return NextResponse.json({ error: "Stripe is not configured" }, { status: 503 });

  const signature = request.headers.get("stripe-signature");
  const payload = await request.text();
  let event;
  try {
    event = await client.webhooks.constructEventAsync(payload, signature ?? "", secret);
  } catch (error) {
    logger.warn("stripe webhook rejected", { feature: "billing", action: "webhook", requestId, reason: error instanceof Error ? error.message : "invalid" });
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    await handleStripeEvent(client, event, requestId);
    return NextResponse.json({ received: true });
  } catch (error) {
    // 500 makes Stripe retry later.
    logger.error("stripe webhook failed", { feature: "billing", action: "webhook", requestId, eventId: event.id, error });
    reportError(error, { feature: "billing", action: "webhook", requestId });
    return NextResponse.json({ error: "Webhook failed" }, { status: 500 });
  }
}
