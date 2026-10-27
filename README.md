# Rootline

Rootline is a traceability web app for small-batch food, drink and skincare makers. Producers (breweries first, then wineries, bakeries, egg farms, fruit and vegetable growers, coffee roasters, skincare makers and other small-batch makers) record where each batch came from. Each batch gets a QR code. Shoppers scan it with their phone camera and see a story page: who made it, how fresh it is, verified badges, a route map from source to store, ingredients and allergens, and the people behind it.

**The core rule:** a claim such as "Organic" or "B Corp" only shows as a badge while a valid, unexpired certificate is on file.

> Status: **the MVP is complete** (Milestones 0–6, 8 and 9), plus shopper photos, social sharing and the redesigned pages. It is live at https://rootline-taupe.vercel.app. Tips (Milestone 7) are planned for later. What is still needed before paying clients is listed under [Before serving clients](#before-serving-clients).

## Run it locally (about 10 minutes)

You need **Node 24+**, **PostgreSQL 16+** running locally, and a free **Supabase** project (login and file storage).

```bash
# 1. Install dependencies (this also generates the Prisma client)
npm install

# 2. Create your env file, then fill in the Supabase values (see "Supabase setup" below)
cp .env.example .env

# 3. Create the database (skip if it already exists)
psql -U postgres -c "CREATE DATABASE rootline;"

# 4. Create the tables, security policies and the app's database role
npm run db:migrate

# 5. Give the app role its local password (once per machine; matches .env.example)
psql -U postgres -d rootline -c "ALTER ROLE rootline_app WITH LOGIN PASSWORD 'rootline_app_dev';"

# 6. Create the file storage buckets in Supabase (once per Supabase project)
npm run storage:setup

# 7. Load the six demo brands (optional, but recommended)
npm run db:seed

# 8. Start the app
npm run dev
```

Then open:

| URL | What it shows |
|---|---|
| http://localhost:3000 | Home page with sign-up and login |
| http://localhost:3000/signup | Producer sign-up ("What do you make?") |
| http://localhost:3000/brand | Brand profile (after logging in) |
| http://localhost:3000/products, /suppliers, /certificates | Products, suppliers and certificates (after logging in) |
| http://localhost:3000/batches/new | The 3-step New batch flow (after logging in) |
| http://localhost:3000/shelf-codes | Reusable shelf QR codes (after logging in) |
| http://localhost:3000/b/cedarpm2 | The main demo story page (after `npm run db:seed`; all six demos are listed below) |
| http://localhost:3000/shopper-photos | Approve or reject photos shoppers shared (after logging in) |
| http://localhost:3000/pricing | Public pricing page |
| http://localhost:3000/billing | Plan & billing (after logging in) |
| http://localhost:3000/styleguide | Design tokens and UI components (development only) |
| http://localhost:3000/api/health | Status of the database, file storage and email provider |

### Supabase setup

1. Create a project at supabase.com.
2. In **Project Settings → API**, copy the URL, the `anon` key and the `service_role` key into `.env` (`SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`).
3. In **Authentication → URL Configuration**, set **Site URL** to `http://localhost:3000` and add `http://localhost:3000/auth/confirm` under **Redirect URLs**. (Add the production URLs too when deploying.)
4. Recommended: in **Authentication → Email Templates → Confirm signup**, change the link to
   `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email`
   so the link also works when opened on a different device from the one used to sign up.
5. Before real pilots, set up custom SMTP (Authentication → SMTP Settings). The built-in sender only allows a few emails per hour.

### Database roles

The app does **not** connect as the database owner. `DATABASE_URL` uses the restricted `rootline_app` role, which cannot bypass row-level security, so each brand only ever sees its own rows. `DIRECT_URL` (the owner) is used only by migrations. The first migration creates the role without a password; give it one per environment (step 5 above).

If something does not work, see [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md).

## Environment variables

All variables are listed in [.env.example](.env.example). Empty optional values mean "not configured". The app still runs, and `/api/health` reports that service as `not_configured`.

| Variable | Required | Purpose |
|---|---|---|
| `APP_URL` | yes | Public base URL, used in QR codes and email links |
| `DATABASE_URL` | yes | Postgres connection the running app uses (the restricted `rootline_app` role) |
| `DIRECT_URL` | yes | Postgres connection for migrations (database owner, not pooled) |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | yes | Server-side Supabase access (storage, auth admin) |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes | Browser-side Supabase auth |
| `RESEND_API_KEY`, `EMAIL_FROM` | for real email | Recall emails. `EMAIL_FROM` must be on a domain verified in Resend |
| `EMAIL_PROVIDER` | optional | `resend` (default) or `log` (emails are written to the logs, not sent: for trying recalls without Resend) |
| `GEOCODER_URL` | optional | Address lookup server for "Find on map". Defaults to OpenStreetMap's public Nominatim (free, max one lookup per second). `off` switches lookups off |
| `TEST_DATABASE_URL`, `TEST_APP_DATABASE_URL` | optional | Override the `rootline_test` connections used by `npm run test:db` |
| `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN` | optional | Error tracking (server / browser) |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | for online payment | Stripe subscriptions. Without them, plans still apply but can't be bought online |
| `SALES_EMAIL` | optional | Shown on /pricing and Plan & billing for Enterprise enquiries |
| `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN` | optional | Source-map upload on Vercel builds |
| `LOG_LEVEL` | optional | `debug`, `info` (default), `warn`, `error` or `silent` |

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server on port 3000 |
| `npm run build` / `npm start` | Production build / serve it |
| `npm run lint` | ESLint, including the folder-boundary rules |
| `npm run typecheck` | Regenerates Next.js route types, then TypeScript in strict mode |
| `npm test` | Vitest unit tests (`src/**/*.test.ts`) |
| `npm run test:e2e` | Playwright browser journeys (`tests/e2e`) on a phone-sized screen. Builds the app into `.next-e2e` and serves it on port 3100, so it can run while `npm run dev` is open. First time only: `npx playwright install chromium` |
| `npm run check` | Lint, type-check and unit tests in one go. Run it before every commit |
| `npm run test:db` | Database tests (row-level security) against the `rootline_test` database, which must exist |
| `npm run storage:setup` | Create or update the Supabase Storage buckets (`brand-media` public; `certificates` and `shopper-photos` private) |
| `npm run db:migrate` | Create/apply migrations in development, then regenerate the Prisma client |
| `npm run db:deploy` | Apply migrations in production |
| `npm run db:seed` | Load one demo brand per industry (see [Demo brands](#demo-brands)), each with a published batch, product photo, certificates, two weeks of demo scans and two recall sign-ups. Running it again resets the demos |
| `npm run stripe:setup` | Create the Starter and Growth products and prices in Stripe (safe to rerun) |
| `npm run plan:set -- <email> growth` | Set a brand's plan by hand (Enterprise contracts, support) |
| `npm run db:reset` | Drop, re-migrate and re-seed the local database (destroys local data) |

## Demo brands

`npm run db:seed` creates six fictional producers in real BC places. Each has a login and a published story page.

| Brand | Industry | Story page | Login |
|---|---|---|---|
| Cedar & Tide | Brewery (main demo) | `/b/cedarpm2` | `demo@cedarandtide.test` / `CedarTide-demo-2026` |
| Blackbird Ridge Winery | Winery | `/b/syrah2v5` | `demo@blackbirdridge.test` / `Rootline-demo-2026` |
| Ridgeline Roasters | Coffee | `/b/kaffe247` | `demo@ridgeline.test` / `Rootline-demo-2026` |
| Dawn Rise Bakehouse | Bakery | `/b/dawnbak3` | `demo@dawnrise.test` / `Rootline-demo-2026` |
| Briar Creek Farm | Poultry & eggs | `/b/eggsfrm2` | `demo@briarcreek.test` / `Rootline-demo-2026` |
| Sunfield Organics | Fruits & vegetables | `/b/harvest7` | `demo@sunfield.test` / `Rootline-demo-2026` |

The brands are described in `prisma/seed/brands-drinks.mts` and `prisma/seed/brands-food.mts` and built by `prisma/seed/build.mts`. Lot numbers and certificates are samples.

## Deploying

The live site runs on Vercel, with a Supabase project for the database, logins and files.

1. **Database changes first:** apply migrations to production as the owner: `DIRECT_URL=<production owner URL> npx prisma migrate deploy`.
2. **Settings:** the Vercel project needs `DATABASE_URL` (the `rootline_app` role through Supabase's transaction pooler, port 6543), `APP_URL`, the four Supabase values and the email settings. `NEXT_PUBLIC_SUPABASE_ANON_KEY` must be added with `--type config`, because the Vercel CLI refuses public keys otherwise.
3. **Deploy:** `vercel deploy --prod`. `.vercelignore` keeps `.env` and local builds out of the upload.
4. **Check:** `/api/health` should report `ok` for the database, storage and email.

## Before serving clients

The MVP works; these are the remaining production steps (details in `docs/DECISIONS.md`):
- final domain before any client prints QR codes (codes contain the address);
- paid Vercel and Supabase plans (Vercel Hobby is non-commercial; free Supabase projects pause when idle);
- a separate production Supabase project (development and production share one today);
- custom SMTP for sign-up emails and a Resend account for recall emails;
- Sentry and uptime monitoring switched on;
- commercial map tiles and address lookup (OpenStreetMap's free services forbid heavy commercial use);
- "Forgot password", account deletion and data download;
- terms of service and a privacy policy.

## Where things are

- `src/features/*`: one folder per feature. Each has its own README.
- `src/lib`: shared plumbing (logger, errors, the server action wrapper, database client, config).
- `src/ui`: design-system components.
- `src/app`: routes only. They stay thin and call into features.
- `docs/`: [ARCHITECTURE DIAGRAMS](docs/ARCHITECTURE-DIAGRAMS.md) (start here), [ARCHITECTURE](docs/ARCHITECTURE.md), [DECISIONS](docs/DECISIONS.md), [TROUBLESHOOTING](docs/TROUBLESHOOTING.md).

## Tech stack

Next.js 16 (App Router, TypeScript strict) · PostgreSQL via Supabase (database, auth, storage) · Prisma 7 · Tailwind CSS 4 · Zod · Leaflet + OpenStreetMap · qrcode · pdf-lib · Resend · Stripe Connect (optional tips) · Sentry · Vitest + Playwright · hosted on Vercel.
