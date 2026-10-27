// Creates Rootline's products and prices in Stripe (test or live, whichever
// key is in .env). Prices are found later by lookup key, so this is safe to run
// again: existing prices are left alone.
//   npm run stripe:setup
import Stripe from "stripe";
import { PLANS, priceLookupKey, SELF_SERVE_PLANS } from "../src/features/billing/plans";

async function main() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Set STRIPE_SECRET_KEY in .env first (use a test key, sk_test_...).");
  const stripe = new Stripe(key);
  const currency = (process.env.STRIPE_CURRENCY ?? "cad").toLowerCase();

  for (const planId of SELF_SERVE_PLANS) {
    const plan = PLANS[planId];
    const existing = await stripe.products.search({ query: `metadata['rootline_plan']:'${planId}'` });
    const product = existing.data[0] ?? (await stripe.products.create({ name: `Rootline ${plan.name}`, description: plan.tagline, metadata: { rootline_plan: planId } }));
    for (const interval of ["month", "year"] as const) {
      const lookupKey = priceLookupKey(planId, interval);
      const found = await stripe.prices.list({ lookup_keys: [lookupKey], limit: 1 });
      if (found.data[0]) {
        console.log(`Exists   ${lookupKey}`);
        continue;
      }
      await stripe.prices.create({
        product: product.id,
        currency,
        unit_amount: plan.price![interval] * 100,
        recurring: { interval },
        lookup_key: lookupKey,
        nickname: `${plan.name} ${interval === "month" ? "monthly" : "yearly"}`,
      });
      console.log(`Created  ${lookupKey}  ${plan.price![interval]} ${currency.toUpperCase()} / ${interval}`);
    }
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
