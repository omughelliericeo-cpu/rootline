# Rootline

Rootline is a food and drink traceability web app. Producers (breweries first, then bakeries, egg farms, coffee roasters, wineries and more) record where each batch came from. Each batch gets a QR code. Shoppers scan it with their phone camera and see a story page: who made it, how fresh it is, verified badges, a route map from source to store, ingredients and allergens, and the people behind it.

**The core rule:** a claim such as "Organic" or "B Corp" only shows as a badge while a valid, unexpired certificate is on file.

> Status: **Milestone 4 (public story page with map) is complete.** See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the milestone plan.

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

# 7. Start the app
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
| http://localhost:3000/b/cedarpm2 | The demo story page (after `npm run db:seed`) |
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
| `RESEND_API_KEY`, `EMAIL_FROM` | from M5 | Recall emails |
| `GEOCODER_URL` | optional | Address lookup server for "Find on map". Defaults to OpenStreetMap's public Nominatim (free, max one lookup per second) |
| `TEST_DATABASE_URL`, `TEST_APP_DATABASE_URL` | optional | Override the `rootline_test` connections used by `npm run test:db` |
| `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN` | optional | Error tracking (server / browser) |
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
| `npm run storage:setup` | Create or update the Supabase Storage buckets (`brand-media` public, `certificates` private) |
| `npm run db:migrate` | Create/apply migrations in development, then regenerate the Prisma client |
| `npm run db:deploy` | Apply migrations in production |
| `npm run db:seed` | Load the demo brewery Cedar & Tide (story page `/b/cedarpm2`; demo login `demo@cedarandtide.test` / `CedarTide-demo-2026`). Other industries follow in Milestone 9 |
| `npm run db:reset` | Drop, re-migrate and re-seed the local database (destroys local data) |

## Where things are

- `src/features/*`: one folder per feature. Each has its own README.
- `src/lib`: shared plumbing (logger, errors, the server action wrapper, database client, config).
- `src/ui`: design-system components.
- `src/app`: routes only. They stay thin and call into features.
- `docs/`: [ARCHITECTURE](docs/ARCHITECTURE.md), [DECISIONS](docs/DECISIONS.md), [TROUBLESHOOTING](docs/TROUBLESHOOTING.md).

## Tech stack

Next.js 16 (App Router, TypeScript strict) · PostgreSQL via Supabase (database, auth, storage) · Prisma 7 · Tailwind CSS 4 · Zod · Leaflet + OpenStreetMap (from M4) · qrcode · pdf-lib · Resend · Stripe Connect (optional tips) · Sentry · Vitest + Playwright · hosted on Vercel.
