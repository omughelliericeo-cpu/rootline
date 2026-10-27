// The Stripe client, or null when Stripe is not set up (no secret key).
import "server-only";
import Stripe from "stripe";
import { serverConfig } from "@/lib/config";

let client: Stripe | null = null;

export function stripe(): Stripe | null {
  const key = serverConfig().STRIPE_SECRET_KEY;
  if (!key) return null;
  client ??= new Stripe(key);
  return client;
}
