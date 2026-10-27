# Billing feature

Rootline's three plans, what each allows, and paying for them with Stripe.

| | Starter | Growth (recommended) | Enterprise |
|---|---|---|---|
| Price (CAD) | $35/month or $400/year | $110/month or $1,200/year | Custom contract |
| Live batches | 3 at a time | Unlimited | Unlimited |
| Active certificates | 2 | Unlimited | Unlimited |
| Shelf codes, recall emails, shopper photos | not included | included | included |

Every plan can show recall warnings on its story pages. New brands get Growth free for 30 days. Brands that existed before plans were added were moved to Growth.

## How the plan in force is worked out

`effectivePlan()` in `service.ts`:
- during a trial: Growth;
- with a Stripe subscription: the paid plan while active, for 7 days while a payment is past due, and until the period ends once cancelled;
- with no subscription: the plan stored on the brand (granted plans), or Starter once a trial is over.

## Main files

| File | What it does |
|---|---|
| `plans.ts` | The single source of truth: prices, limits, features, the /pricing highlights and comparison rows |
| `service.ts` | Pure rules: `effectivePlan`, `can`, `atLimit`, messages, Stripe lookup keys. Unit tested |
| `guards.ts` | `ownerPlan`, `ownerCan`, `requireFeature`, `requireUnderLimit` for server actions and pages |
| `server/actions.ts` | `startCheckout` (Stripe Checkout) and `openBillingPortal` |
| `server/webhook.ts` | Applies Stripe events by re-reading the subscription, through `apply_subscription()` |
| `server/queries.ts` | `getBilling`: plan, trial, renewal and usage for Plan & billing |
| `components/` | `PricingTable` and `ComparisonTable` (public /pricing), `BillingPanel` (/billing), `UpgradeNotice` |

Where limits are enforced:
- publishing a batch (`batches/server/status-actions.ts`);
- uploading a certificate;
- creating or pointing a shelf code;
- recall sign-up and sending;
- sharing a shopper photo;
- the story page hides the recall sign-up and photo-sharing forms when the plan doesn't include them.

## Security

The app's database role cannot update the plan or billing columns (column-level grants). Only `apply_subscription()` can, and only the signed Stripe webhook calls it. Stripe event ids are recorded in `stripe_event` through `stripe_event_claim()`.

## Setting up Stripe (test mode)

1. Add `STRIPE_SECRET_KEY=sk_test_…` to `.env`.
2. Run `npm run stripe:setup` to create the products and four prices.
3. Run `stripe listen --forward-to localhost:3000/api/stripe/webhook`, and put the `whsec_…` it prints in `STRIPE_WEBHOOK_SECRET`.
4. On Plan & billing, choose Growth and pay with card `4242 4242 4242 4242` and any future date. The plan changes within seconds.

For the live site, add the same two variables in Vercel, and create a webhook endpoint in the Stripe dashboard for `https://<site>/api/stripe/webhook` with the events `checkout.session.completed` and `customer.subscription.created/updated/deleted`.

## Known limitations

- Taxes: switch on Stripe Tax in the dashboard if needed. Checkout does not add tax by itself.
- Enterprise items marked "Coming soon" (multi-site, printer API, ERP exports, advanced analytics) are not built.

## How to test

- Unit: `npx vitest run src/features/billing`
- Database: `npx vitest run --config vitest.db.config.mts src/features/billing`
- Browser: `npx playwright test tests/e2e/billing.spec.ts`
