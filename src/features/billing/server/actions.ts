"use server";
// Producer actions: subscribe through Stripe Checkout, and manage an existing
// subscription (change plan, card, invoices, cancel) in Stripe's billing portal.
// Neither changes the brand's plan: Stripe's webhook does that once payment is
// confirmed (see webhook.ts).
import { redirect } from "next/navigation";
import { defineOwnerAction } from "@/lib/action";
import { tenantOf } from "@/lib/auth";
import { serverConfig } from "@/lib/config";
import { withTenant } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { priceLookupKey } from "../plans";
import { checkoutSchema, portalSchema } from "../schema";
import { stripe } from "./stripe";

const appUrl = () => serverConfig().APP_URL.replace(/\/+$/, "");

export const startCheckout = defineOwnerAction({
  feature: "billing",
  action: "startCheckout",
  input: checkoutSchema,
  handler: async ({ plan, interval }, { owner }) => {
    const client = stripe();
    if (!client) throw new AppError("BILLING_NOT_CONFIGURED");
    const brand = await withTenant(tenantOf(owner), (tx) =>
      tx.brand.findUniqueOrThrow({ where: { id: owner.brandId }, select: { stripeCustomerId: true } }),
    );
    let url: string | null;
    try {
      const prices = await client.prices.list({ lookup_keys: [priceLookupKey(plan, interval)], active: true, limit: 1 });
      const price = prices.data[0];
      if (!price) throw new AppError("BILLING_NOT_CONFIGURED", "This plan isn't set up in Stripe yet. Run npm run stripe:setup.");
      const session = await client.checkout.sessions.create({
        mode: "subscription",
        line_items: [{ price: price.id, quantity: 1 }],
        client_reference_id: owner.brandId,
        subscription_data: { metadata: { brandId: owner.brandId } },
        ...(brand.stripeCustomerId ? { customer: brand.stripeCustomerId } : { customer_email: owner.email }),
        allow_promotion_codes: true,
        success_url: `${appUrl()}/billing?checkout=success`,
        cancel_url: `${appUrl()}/billing?checkout=cancelled`,
      });
      url = session.url;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError("BILLING_FAILED", undefined, { cause: error });
    }
    if (!url) throw new AppError("BILLING_FAILED");
    redirect(url);
  },
});

export const openBillingPortal = defineOwnerAction({
  feature: "billing",
  action: "openPortal",
  input: portalSchema,
  handler: async (_input, { owner }) => {
    const client = stripe();
    if (!client) throw new AppError("BILLING_NOT_CONFIGURED");
    const brand = await withTenant(tenantOf(owner), (tx) =>
      tx.brand.findUniqueOrThrow({ where: { id: owner.brandId }, select: { stripeCustomerId: true } }),
    );
    if (!brand.stripeCustomerId) throw new AppError("BILLING_NOT_CONFIGURED", "There's no subscription to manage yet. Choose a plan first.");
    let url: string;
    try {
      url = (await client.billingPortal.sessions.create({ customer: brand.stripeCustomerId, return_url: `${appUrl()}/billing` })).url;
    } catch (error) {
      throw new AppError("BILLING_FAILED", undefined, { cause: error });
    }
    redirect(url);
  },
});
