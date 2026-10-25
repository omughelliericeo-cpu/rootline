# Architecture

Rootline is one shared engine plus **industry templates**. Every industry uses the same features (suppliers, products, batches, journey, certificates, story page). A template only changes labels, extra fields, date names, the freshness wording, allowed badges and default journey stops.

## Folder map

```
src/
  app/          Routes only (pages, route handlers). Thin: they call feature code.
  features/     One folder per feature (see below). Each one holds its own
                README, components, server code, schema, rules and tests.
  lib/          Shared plumbing used by every feature.
  ui/           Design-system components (Button, Card, Badge, Field, ...).
  proxy.ts      Runs before every request: assigns the requestId.
  instrumentation.ts / instrumentation-client.ts   Sentry + crash logging.
prisma/         Database schema, migrations, seed script.
tests/e2e/      Playwright browser journeys.
docs/           This file, DECISIONS.md, TROUBLESHOOTING.md.
```

### Inside a feature folder

```
src/features/batches/
  README.md     What it does, files, data, connections, limits, how to test
  index.ts      The ONLY file other code may import from
  schema.ts     Zod schemas and types (shared by the browser and the server)
  service.ts    Business rules, pure functions where possible
  components/   UI for this feature only
  server/       Server actions and queries. The only place that touches the database
  tests/        Unit tests for service.ts and friends
```

**The rules, enforced by ESLint (`eslint.config.mjs`):**
- Code outside a feature imports it as `@/features/batches`, never `@/features/batches/service`. Inside a feature, use relative imports.
- Only `src/features/*/server/**` and `src/lib/**` may import the database client (`@/lib/db`) or the generated Prisma client.
- No industry-specific `if/else` anywhere. Features read labels and fields from the brand's template. (This is a review rule; it isn't lint-enforced.)
- Browser-side components (`"use client"`) must not import another feature's `index.ts` if that index also exports server-only code (database queries). `npm run build` fails if they do. Put shared pure helpers in `src/lib` instead, as was done for `coordinates.ts`.

### Feature map

| Feature | What it owns | Milestone |
|---|---|---|
| `auth` | Email sign-up / login, the one owner per brand | M1 |
| `industries` | The five templates, their Zod schema and the registry | M1 |
| `brand` | Brand profile, photos, people, quote, video link | M1 |
| `suppliers` | Farms and suppliers with location | M2 |
| `products` | Product templates: ingredients, allergens, dietary tags | M2 |
| `certificates` | Certificate files and the "is this badge valid?" rule | M2 |
| `batches` | Batches, supplier lots, route stops, the 3-step New batch flow | M3 |
| `qr` | Batch codes, reusable shelf codes, PNG/SVG, A4 sticker sheet | M3 |
| `story-page` | The public shopper page and its map | M4 |
| `recalls` | Shopper sign-up, recall messages, unsubscribe | M5 |
| `analytics` | Scan events and counts | M6 |
| `dashboard` | Producer home: stats, expiring certificates, recent batches | M6 |
| `tips` | Optional "Say thanks" tipping via Stripe Connect | M7 |
| `compliance` | Per-batch CSV and PDF export | M8 |

### Shared code in `src/lib`

| File | Purpose |
|---|---|
| `action.ts` | `defineAction()` wraps every server action: requestId → Zod validation → logs (start/success/failure, with duration) → typed `Result` → Sentry for unexpected errors. Accepts an object, a `FormData`, or `(previousState, FormData)`. `defineOwnerAction()` also requires a logged-in owner and passes `ctx.owner`. A thrown `ValidationError` becomes per-field messages |
| `result.ts` | `Result<T>` = `{ ok: true, data }` or `{ ok: false, error: { code, message, requestId, fieldErrors? } }` |
| `errors.ts` | Error codes (`VALIDATION_FAILED`, `CERT_EXPIRED`, `IN_USE`, ...), `AppError` for expected failures, `ValidationError` for field errors found after the schema check (e.g. against the industry template) |
| `logger.ts` | Structured JSON logs: timestamp, level, feature, action, requestId, brandId, durationMs |
| `request-id.ts` / `request-context.ts` | Creating, validating and reading the per-request id |
| `config.ts` | Environment variables, validated with Zod |
| `db.ts` | The Prisma client (Prisma 7 with the `pg` driver adapter), `withTenant()` (runs queries with the row-level security settings for the current user and brand) and `isStillReferenced()` (spots "still in use" delete errors) |
| `auth.ts` | `requireOwner()` for pages (redirects to /login), `getOwner()` (includes the brand's time zone), `getSessionUser()`, `tenantOf(owner)` |
| `supabase.ts` | Supabase clients: as the logged-in user, or admin (storage, test setup) |
| `supabase-proxy.ts` | Refreshes the login session on each request (called by `src/proxy.ts`) |
| `storage.ts`, `storage-rules.ts` | Uploads: public images to `brand-media`, private certificate files to `certificates` (signed links only). Accepted types and sizes, file paths, public URLs |
| `media-cleanup.ts` | Removes images no longer used, and removes a fresh upload again if the save that refers to it fails |
| `dates.ts` | Calendar-date keys ("2026-10-24") in the brand's time zone, used for expiry checks |
| `ids.ts` | `isUuid()`, so `/products/not-an-id` shows "not found" instead of a database error |
| (story-page) `RouteMap.tsx` | The only Leaflet file: swap it to change map providers |
| `codes.ts` | Random 8-character public codes for QR links (no look-alike characters), and unique-clash detection |
| `coordinates.ts` | Reading "latitude, longitude" pasted from a map app, and writing it back |
| `geocode.ts`, `geocode-rules.ts`, `geocode-action.ts` | Address lookup for "Find on map" (OpenStreetMap Nominatim): throttled to 1 request per second, cached, results biased towards the brand's area. Used by `src/ui/MapPositionField.tsx` |
| `form.ts` | `FormData` → object (`name[]` → arrays, `extra.key` → nested), plus Zod helpers for blank inputs and checkbox lists |
| `sentry.ts`, `sentry-options.ts` | Error reporting with feature/requestId tags; privacy settings |
| `health/` | The checks behind `GET /api/health` |

### Forms (`src/ui/useFormAction.ts`)

Every producer form uses `useFormAction(serverAction)`. It returns `{ result, pending, formProps }`; spread `formProps` onto the `<form>` and pass `pending` to `SubmitButton`.
- The form posts to the server action, so it works before JavaScript loads.
- Unlike a plain `<form action>`, a failed save does **not** clear what the producer typed. React 19 clears forms after every action; the hook avoids that.
- Options: `resetOnSuccess` (e.g. "Add person"), `confirmMessage` (deletes).
- `FormStatus` shows the success message, or the error with its reference (requestId). `fieldError(result, "name")` gives the message for one field.

## Data model

Tables marked **(built)** exist in `prisma/schema.prisma`. The others are the agreed design and land in later milestones.

- **Brand** (built): a producer business. It has exactly one owner (a Supabase auth user) and an `industry`, which picks its template. It holds the profile: name, location, optional map position, time zone (for "Baked at 5am today"), logo and photo paths in storage, two brand colours, quote, and an optional video link. Every other table belongs to a brand. (Whether tips are switched on is added with the tips feature in M7.)
- **BrandPerson** (built): a person shown under "Meet the maker": photo, name, role. Ordered by `position`. In M7 a person can be marked as a tip recipient, with their Stripe Connect account id. No bank details are ever stored.
- **Supplier** (built): a farm or supplier the brand buys from, entered once: name, type (from the template, e.g. "Hop farm"), what it supplies, address and map position (latitude/longitude).
- **Product** (built): a product the brand makes repeatedly: name, format, ingredients (in label order), allergens, dietary tags and an optional photo. Industry-specific fields (e.g. alcohol % for beer) live in the `extra` JSON column, checked against the template.
- **Certificate** (built): an uploaded certificate file with claim name, issuer and expiry date. It attaches to the brand, one product or one supplier. A badge is shown only while the certificate is `VALID` (not revoked), has its file, and is on or before its expiry date. That is computed every time and never stored as a flag. The file sits in a private bucket. A product or supplier with certificates cannot be deleted until they are removed (`ON DELETE NO ACTION`), and a check stops one certificate covering both a product and a supplier.
- **Batch** (built): one production run of a product, e.g. "Hazy Pale Ale, Brew 214". It has a number (unique per product), made and packaged dates, industry fields (`extra`), a status (draft, live, sold out) and a random 8-character code used in its QR link (`/b/{code}`). The public will only ever see live or sold-out batches. A product with batches cannot be deleted.
- **BatchLot** (built): which supplier lots went into a batch (supplier + lot number + ingredient). This is the "earliest point the brand can prove". A new batch starts with the lots from the previous batch of the same product. A supplier used in lots cannot be deleted.
- **RouteStop** (built): the ordered stops on a batch's journey (farm, brewery, cold storage, distributor, store), with address, map position, date and an optional note such as storage temperature. Address and map position may be blank while the batch is a draft; publishing requires them.
- **ShelfCode** (built): a reusable QR code for a shelf or tap (`/s/{code}`) that the producer points at the current batch. Deleting the batch leaves the shelf code pointing at nothing.
- **ScanEvent** (built): one row per QR scan: which batch, when, via a batch or shelf code, and a rough location (country/region/city) when known. No IP address is stored. The public can add scans of published batches but never read them.
- **RecallSubscriber**: a shopper's email for one batch, with the consent text they agreed to and an unsubscribe token. Never visible to the public.
- **RecallMessage**: a recall message the producer sent to a batch's subscribers.
- **Tip**: a tip a shopper paid to one person for one batch: amount, platform fee, Stripe Checkout session, status.
- **StripeEvent**: Stripe webhook events already processed, so a repeated webhook does nothing the second time.

**Security (row-level security, built in M1):**
- The app connects to Postgres as `rootline_app`, a role that is not the table owner and cannot bypass RLS. Migrations run as the owner (`DIRECT_URL`).
- Every query runs inside `withTenant({ userId, brandId }, tx => ...)`. This sets `app.user_id` and `app.brand_id` for that transaction only.
- Policies: a `brand` row is visible only when `owner_user_id = app.user_id`. Child tables (`brand_person`, `supplier`, `product`, `certificate`, `batch`, `shelf_code`, and all later ones) are visible only when `brand_id = app.brand_id`. `batch_lot` and `route_stop` have no `brand_id`; they are visible when their batch is.
- Foreign keys are **not** filtered by RLS. So when a row points at another row chosen by the user (e.g. a certificate's product), the action checks that the target belongs to the same brand.
- With no tenant set, every query returns nothing.
- `src/lib/tests/rls.db.test.ts` proves this (`npm run test:db`).
- Public story pages use `withPublic()`, which sets `app.public = 'on'`. Extra read-only policies (migration `story_page_public_access`) then let through only LIVE/SOLD_OUT batches and what their story shows: brand, people, product, lots, suppliers, stops and valid certificates. Shelf codes are readable only when pointing at a published batch. Scans can be added but not read. `src/lib/tests/public-read.db.test.ts` proves this.
- Supabase's own Data API cannot read these tables either: RLS is on and no policy grants Supabase's `anon`/`authenticated` roles anything.

## Request flows

### Every request (built in M0)
1. `src/proxy.ts` creates a requestId (`req_` + 12 hex characters). It puts the id on the request headers, the response headers (`x-request-id`) and a readable cookie (`rl_rid`).
2. Server code reads it with `getRequestId()`. `defineAction()` adds it to every log line and to every error result.
3. If rendering crashes, `onRequestError` in `src/instrumentation.ts` logs the error with the requestId and Next's error digest. The error boundary (`src/ui/ErrorPanel.tsx`) shows the user both values as "Reference" and "Error code".

### Producer signs up (built in M1)
1. `/signup` asks "What do you make?" (a plain GET form, so the choice goes into the URL).
2. Step two posts the brand and account details to the `signUp` server action (`features/auth`).
3. Supabase Auth creates the user and sends the confirmation email.
4. `createBrandForOwner` (`features/brand`) inserts the brand with the chosen industry, inside `withTenant({ userId })`.
5. The confirmation link opens `/auth/confirm`, which starts the session and redirects to `/dashboard`.

### A producer page or action (built in M1)
1. `src/proxy.ts` refreshes the Supabase session cookies.
2. The page calls `requireOwner()`: it checks the user with Supabase and looks up their brand, or redirects to `/login`.
3. A form posts to a server action defined with `defineOwnerAction`. The wrapper validates the input, loads the owner, adds `brandId` to the logs, and runs the handler.
4. The handler's queries go through `withTenant`, so Postgres itself refuses other brands' rows.
5. The handler calls `revalidatePath`, so the page re-renders with the saved data.

### Shopper scans a QR code (built in M4)
1. The phone camera opens `/b/{code}` (or `/s/{code}`, which looks up the shelf code and redirects with a 307 to `/b/{batchCode}?via=shelf`).
2. `src/proxy.ts` adds a requestId and skips the login-session refresh for public paths.
3. The page calls `loadStory(code)`: one public-mode transaction (`withPublic`). Row-level security returns nothing unless the batch is LIVE or SOLD_OUT.
4. `buildStory(raw, now)` (pure) works out the headline, freshness line, verified badges (`storyBadges` → `visibleBadges`), sources, numbered stops and map points.
5. The server renders the full page (no JavaScript needed); `RouteMap` then loads Leaflet in the browser.
6. After the response is sent, `after()` runs `recordScan`, which inserts a `scan_event` with a coarse location. A failure is only logged.
7. Tapping a badge opens `/b/{code}/certificates/{id}`. It re-checks the certificate is valid and in this story, then redirects to a 5-minute signed link.

### Producer creates a batch (built in M3)
1. `/batches/new` (step 1) posts product, number and dates to `createBatch`.
2. The action converts the dates from the brand's time zone, validates the industry fields, checks the product belongs to the brand, and finds the product's previous batch.
3. In one `withTenant` transaction it creates the batch with a fresh random code. Lots are copied from the previous batch, and so are stops (without dates); a product's first batch gets the template's default stops instead.
4. It redirects to `/batches/{id}/lots` (step 2). `saveLots` replaces the lots, accepting only the brand's own suppliers.
5. It redirects to `/batches/{id}/print` (step 3): the QR code from `/batches/{id}/qr?format=…`, plus **Publish**.
6. `changeBatchStatus` re-checks `publishProblems` on the server before setting `LIVE` and `published_at`.
