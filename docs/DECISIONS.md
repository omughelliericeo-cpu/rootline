# Decisions log

Each entry records a significant technical choice: what we chose, what else we considered, and why. Newest at the bottom. When a decision changes, add a new entry rather than editing the old one.

---

### 2026-10-23 · Organise code by feature, with import boundaries enforced by lint
- **Choice:** `src/features/{name}` folders, each with README, index.ts, schema.ts, service.ts, components/, server/, tests/. ESLint `no-restricted-imports` blocks deep imports into another feature and blocks database access outside `server/` folders and `src/lib`.
- **Alternatives:** organise by file type (components/, actions/, models/); rely on code review for the rules.
- **Why:** a new developer can find everything about one feature in one place. Lint catches boundary breaks automatically instead of depending on reviewers.

### 2026-10-23 · Next.js 16 with Cache Components turned off
- **Choice:** Next.js 16.4 App Router with the default `cacheComponents` and `partialPrefetching` options removed from `next.config.ts`.
- **Alternatives:** keep Cache Components and wrap dynamic sections in `<Suspense>`.
- **Why:** Cache Components stream dynamic parts of a page in with JavaScript. The public story page must show its core content with JavaScript disabled. Almost every page here reads the database per request anyway, so there is little to gain, and the simpler model is easier for new developers.

### 2026-10-23 · Prisma 7.10 (stable) with the `pg` driver adapter
- **Choice:** `prisma@7.10.1`, `@prisma/client`, `@prisma/adapter-pg`. The client is generated into `src/generated/prisma` (gitignored, regenerated on `npm install`).
- **Alternatives:** Prisma 8.0 (only a release candidate at the time); Prisma 6 (no adapter needed, but outdated).
- **Why:** latest stable release. Prisma 7 requires a driver adapter, and `adapter-pg` is Prisma's own adapter for Postgres. It adds the `pg` package as a dependency.

### 2026-10-23 · Tailwind CSS 4 reading a JS config for the design tokens
- **Choice:** tokens (colours, fonts, 4px radius) live once in `tailwind.config.mts`, loaded by `@config` in `globals.css`. Added one token not in the Figma palette: `danger` (#8B2A1E) for errors and destructive buttons.
- **Alternatives:** Tailwind 4's CSS-first `@theme` block.
- **Why:** the brief asks for tokens "defined once in the Tailwind config", and a typed config file with comments is easy to find. `.mts` makes Node load it as an ES module without warnings.

### 2026-10-23 · Local Postgres for development, Supabase for auth and storage
- **Choice:** develop against a local PostgreSQL 16 (`rootline` and `rootline_test` databases). From M1, use a hosted free-tier Supabase project for auth and file storage. Production uses Supabase Postgres.
- **Alternatives:** the Supabase CLI in Docker for everything; hosted Supabase only.
- **Why:** local Postgres is fast, works offline and was already installed. No Docker is needed.

### 2026-10-23 · Environment variables loaded without dotenv
- **Choice:** Next.js loads `.env` itself. `prisma.config.ts` uses Node's built-in `process.loadEnvFile`. All server variables are validated by Zod in `src/lib/config.ts`.
- **Alternatives:** the `dotenv` package.
- **Why:** one less dependency. Zod validation names the exact variable that is missing or malformed.

### 2026-10-23 · requestId via the proxy, shown on error screens
- **Choice:** `src/proxy.ts` mints `req_` + 12 hex characters per request. It sets the id as a request header, a response header and a readable `rl_rid` cookie. Error screens show it with Next's error digest, and `onRequestError` logs both.
- **Alternatives:** reuse Vercel's `x-vercel-id`; pass the id through React context from the layout.
- **Why:** works locally and on Vercel. The cookie stays correct after client-side navigation, while a layout-provided value would be stale. Incoming ids are never trusted, so clients cannot inject log values.

### 2026-10-23 · Sentry v11 with strict privacy settings
- **Choice:** `@sentry/nextjs` 11 on browser, server and edge, initialised only when a DSN is set. `dataCollection` sends no cookies, request bodies, query strings or user info. Only the `x-request-id` and `user-agent` headers are kept. Errors only (tracing off).
- **Alternatives:** Sentry defaults, which collect bodies and cookies.
- **Why:** request bodies can contain shopper emails (recall sign-ups). The requestId tag is enough to join a Sentry issue to the logs.

### 2026-10-23 · Defaults agreed in the plan
- **Addresses → map position:** click on a map or type lat/lng. No geocoding service, because that would be a third-party integration.
- **Certificate status:** valid until it expires or the producer marks it revoked. There is no Rootline admin review in the MVP.
- **Tips:** built in M7, after the dashboard exists, so tip totals have somewhere to show.
- **Scan location:** Vercel's geo headers in production, none locally. IP addresses are never stored.
- **Maps:** plain Leaflet behind one `RouteMap` component, without react-leaflet, so it can be swapped for Mapbox later.
- **PDFs:** pdf-lib for both the sticker sheet and the compliance export.

---

## Milestone 1

### 2026-10-24 · Supabase client packages
- **Choice:** `@supabase/supabase-js` and `@supabase/ssr` (approved by the product owner).
- **Alternatives:** calling Supabase's REST API by hand.
- **Why:** these are the official clients. `@supabase/ssr` handles session cookies across server components, server actions and the proxy.

### 2026-10-24 · Row-level security through a restricted role plus per-transaction settings
- **Choice:** Prisma connects as `rootline_app` (no BYPASSRLS). `withTenant()` runs each unit of work in a transaction that first sets `app.user_id` and `app.brand_id` with `set_config(..., true)`. Policies compare rows to those settings.
- **Alternatives:** query through Supabase's client with the user's JWT (`auth.uid()` policies); app-level filtering only.
- **Why:** it keeps Prisma as the one database layer, as the brief asks. The settings are transaction-scoped, so a pooled connection never carries one brand's identity into another request. A forgotten `where brandId` in app code still cannot leak data. The role is created without a password in the migration, and each environment sets its own.

### 2026-10-24 · The brand is created at sign-up, before email confirmation
- **Choice:** `signUp` creates the Supabase user and the brand row in the same action. If the brand insert fails, the user is deleted. A repeat sign-up before confirming reuses the existing brand.
- **Alternatives:** create the brand on first login after confirmation (keeping the sign-up answers in user metadata).
- **Why:** fewer moving parts. The industry choice is saved immediately, and there is no "half set-up" state to handle at login.

### 2026-10-24 · Email confirmation stays on; tests use pre-confirmed users
- **Choice:** keep Supabase's "Confirm email" on (product owner's choice). Playwright creates confirmed users with the admin API, so tests never send email.
- **Alternatives:** turn confirmation off in development.
- **Why:** development behaves like production. Supabase's built-in sender has a small hourly limit.

### 2026-10-24 · Forms post to server actions, with useActionState for messages
- **Choice:** every producer form is `<form action={...}>` bound to a `defineAction` result, with `useActionState` for inline errors and success messages. Step one of sign-up is a plain GET form.
- **Alternatives:** client-side fetch to API routes; a form library.
- **Why:** forms work before JavaScript loads (useful on slow phone connections), there is no extra dependency, and the typed `Result` comes straight back to the form.

### 2026-10-24 · Images: public bucket, server-action uploads, 4 MB limit
- **Choice:** logos, photos and portraits go to a public Supabase bucket `brand-media`, uploaded through server actions using the service-role key. Only JPG/PNG/WebP up to 4 MB. Files get random names under the brand's folder. The database stores paths, not URLs.
- **Alternatives:** signed direct uploads from the browser (needs JavaScript and more code); a private bucket with signed URLs (slower story pages).
- **Why:** story-page images must be public and cacheable anyway. Vercel limits request bodies to 4.5 MB. SVG is refused because it can contain scripts. Certificates (M2) will use a separate private bucket.

### 2026-10-24 · Industry templates are registered in one list
- **Choice:** templates are listed in `templates/index.ts`. A test fails if a template file exists but is not listed.
- **Alternatives:** automatic discovery of files in the folder.
- **Why:** Next.js bundles cannot reliably discover files at runtime. One explicit line, guarded by a test, is the simplest safe option. Adding an industry is therefore one file plus one line plus the automatic test.

### 2026-10-24 · Freshness counted in calendar days in the brand's time zone
- **Choice:** `Brand.timezone` (default America/Vancouver). `freshnessLabel` compares calendar dates in that zone. After 60 days the line switches to the month ("Canned in June 2026").
- **Alternatives:** count 24-hour periods in UTC.
- **Why:** "Baked at 5am today" and "Canned yesterday" must match what the producer and shopper see on the calendar.

### 2026-10-24 · Database tests run against a separate `rootline_test` database
- **Choice:** `npm run test:db` applies migrations with `prisma migrate deploy` and refuses to run unless the database is named `rootline_test`.
- **Alternatives:** `prisma migrate reset` before each run.
- **Why:** deploy never drops data, and the name check stops the tests from ever touching a real database.

---

## Milestone 2

### 2026-10-24 · Certificate validity is computed, inclusive of the expiry day, in the brand's time zone
- **Choice:** `expires_on` is a date-only column holding the last valid day. `isCertificateValid` compares it with today's date in `Brand.timezone`. Revoked certificates and certificates without a file never count. Badges must also be in the template's `allowedBadges`.
- **Alternatives:** a stored `is_valid` flag updated by a nightly job; comparing timestamps in UTC.
- **Why:** the brief forbids stored flags. Computing it means a badge disappears the moment a certificate lapses, with no job to forget. "Valid until 30 June" should mean all of 30 June where the producer is.

### 2026-10-24 · Certificate files in a private bucket, opened through 5-minute signed links
- **Choice:** bucket `certificates` (private). The owner opens a file via `GET /certificates/{id}/file`, which checks ownership and redirects to a signed link. The story page (M4) will do the same for valid certificates only.
- **Alternatives:** keep them in the public bucket.
- **Why:** certificates can include business details. Only currently valid ones should ever be viewable by shoppers.

### 2026-10-24 · Deleting a product or supplier that has certificates is blocked (ON DELETE NO ACTION)
- **Choice:** the foreign keys from `certificate` use `NoAction`. The app turns the database error into `IN_USE` ("Delete those first").
- **Alternatives:** cascade-delete the certificates; set them to brand-wide (`SET NULL`); `Restrict`.
- **Why:** cascading would silently delete proof. Setting it to brand-wide would make a product-only claim look brand-wide, which is untrue. `Restrict` is checked immediately, so it broke deleting a whole brand; `NoAction` is checked at the end of the statement, so brand deletion still cascades.

### 2026-10-24 · Check ownership of referenced rows in actions
- **Choice:** when a user picks a row to point at (a certificate's product or supplier), the action checks that the row belongs to the same brand before saving.
- **Why:** Postgres foreign-key checks ignore row-level security. Without this, a forged form could attach a certificate to another brand's product id.

### 2026-10-24 · Map position typed or pasted as "latitude, longitude"
- **Choice:** one text field that accepts what Google Maps copies on right-click. It is parsed and range-checked by `parseCoordinates`.
- **Alternatives:** two number fields; a geocoding service.
- **Why:** pasting one value is quickest on a phone, and there is no third-party service (out of scope). Click-to-place arrives with the map component.

### 2026-10-24 · Industry fields validated after the base schema
- **Choice:** product forms send `extra.<key>` fields. The base Zod schema accepts any `extra` object; the action then validates it with `extraFieldsSchema(template.productFields)` and reports errors per field (`ValidationError`).
- **Why:** the allowed fields depend on the brand's industry, which is only known once the owner is loaded. Unknown keys are dropped, so the JSON column holds only template fields.

### 2026-10-24 · Forms keep what was typed after a failed save (`useFormAction`)
- **Choice:** a small hook submits through `onSubmit` plus a React transition, while keeping `action` for no-JavaScript use. Options: `resetOnSuccess` and `confirmMessage`.
- **Alternatives:** plain `<form action>` with `useActionState`; controlled inputs everywhere; a form library.
- **Why:** React 19 clears a form after every action submission, including failed ones, so one typo wiped the whole form. That would be painful on a phone. The hook fixes this in one place with no new dependency.

### 2026-10-24 · Browser console forwarding turned off in development
- **Choice:** `logging.browserToTerminal: false` in `next.config.ts`.
- **Why:** with forwarding on (Next 16.4.3 on Windows), every page load in `next dev` triggered a recompile and a full reload. Pages reloaded in a loop (16 times in 12 seconds were measured) and forms lost their input. Turning it off fixed it. Browser errors still reach Sentry. Revisit when upgrading Next.js.

### 2026-10-24 · Browser tests run against a production build in `.next-e2e`
- **Choice:** Playwright starts `scripts/e2e-server.mjs`, which runs `next build` and `next start` with `distDir` `.next-e2e` on port 3100.
- **Alternatives:** test against `next dev`.
- **Why:** dev mode compiles a page on first visit and then reloads it, which wiped forms mid-test and made tests flaky. A production build behaves like the real site. A separate build folder lets tests run while `npm run dev` is open.

---

## Milestone 3

### 2026-10-25 · New batch = 3 screens; lots and journey copied from the previous batch
- **Choice:** step 1 creates a draft (product, number, dates). The lots and the journey stops are copied from the product's previous batch at that moment; stop dates are not copied. Step 2 confirms the lots, and step 3 prints and publishes. The journey has its own edit page outside the three steps.
- **Alternatives:** put the journey in the flow as a fourth step; create nothing until the last step.
- **Why:** the brief names three steps and a 2-minute target on a phone. Most batches repeat the last one's suppliers and route, so copying makes a repeat batch three quick confirmations. Saving a draft at step 1 means nothing is lost if the phone locks halfway.

### 2026-10-25 · Publishing requires a supplier lot and a full map position for every stop
- **Choice:** `publishProblems` blocks publishing until there is at least one lot and every stop has an address and map position, plus the packaged date when freshness counts from it. The server checks again, not just the button.
- **Why:** the core rule is that every journey starts at a named supplier and lot. A story page with a broken map or a missing "Canned N days ago" would undermine trust. Drafts may be incomplete.

### 2026-10-25 · Template names the producer's own stop (`ownStopType`)
- **Choice:** each template says which default stop is the producer's own place (brewery, bakery, farm, roastery, winery). A product's first batch fills that stop from the brand profile.
- **Alternatives:** assume the first stop is the producer.
- **Why:** coffee and wine journeys start at a farm or vineyard, not at the producer. A template property avoids industry `if/else`.

### 2026-10-25 · Random 8-character public codes
- **Choice:** batch and shelf codes are 8 random characters from a 31-letter alphabet with no look-alikes (no 0/o, 1/l/i), via `crypto.getRandomValues`. Unique in the database, retried on the (rare) clash.
- **Alternatives:** sequential numbers; full UUIDs.
- **Why:** sequential numbers let anyone guess other batches' URLs, including drafts later published. UUIDs make denser QR codes that are harder to scan from a small label.

### 2026-10-25 · Only drafts can be deleted
- **Choice:** published or sold-out batches can be taken offline or marked sold out, but not deleted.
- **Why:** once a QR code is printed, shoppers and recall subscribers rely on that batch existing. Recall alerts (M5) also need it.

### 2026-10-25 · "In use" foreign keys are DEFERRABLE INITIALLY DEFERRED
- **Choice:** the NO ACTION foreign keys (certificate → product/supplier, batch → product, lot → supplier) are checked when the transaction commits (raw SQL migration `defer_in_use_checks`). `isStillReferenced()` recognises both error shapes: immediate P2003, and the driver adapter's `ForeignKeyConstraintViolation` at commit.
- **Why:** checked after each internal statement, deleting a whole brand failed partway through its cascade (the RLS test caught this). Deferred checks still block deleting a single product or supplier that is in use.

### 2026-10-25 · QR rendering: `qrcode` for SVG/PNG, `pdf-lib` for an Avery L7160 sticker sheet
- **Choice:** codes are dark ink on white with medium error correction. The PDF is 21 labels of 63.5 × 38.1 mm using built-in Helvetica.
- **Alternatives:** a custom label size; embedding brand fonts in the PDF.
- **Why:** L7160-style sheets are sold everywhere, so producers can print at home or the office. Built-in fonts keep the PDF small with no font files to ship. Characters outside Western European are replaced rather than failing.

### 2026-10-25 · Repeated rows sent as parallel lists
- **Choice:** the lots and journey forms name every input with `[]` (`supplierId[]`, `lotNumber[]`), always send every column, and get two spare rows. `rows.ts` zips them back and ignores blank rows.
- **Alternatives:** JavaScript "add row" buttons with a JSON payload.
- **Why:** it works without JavaScript and is easy to follow. Per-row error messages say exactly which row to fix.

### 2026-10-25 · Shared pure helpers live in `src/lib` when browser components need them
- **Choice:** map-position helpers moved from the suppliers feature to `src/lib/coordinates.ts`.
- **Why:** a browser component that imports a feature's `index.ts` also pulls in that feature's server-only queries, which breaks the production build. Pure helpers used across features belong in `lib`.

### 2026-10-25 · Route types regenerated as part of `npm run typecheck`
- **Choice:** `typecheck` runs `next typegen` before `tsc`.
- **Why:** Next.js 16 types `PageProps<"/route">` from generated files. Without regenerating, a new page fails the type-check until the dev server has run.

---

## Changes after Milestone 3

### 2026-10-25 · Map position suggested from the address (OpenStreetMap Nominatim)
- **Choice:** the Map position field (`src/ui/MapPositionField.tsx`) looks up the typed address with OpenStreetMap's Nominatim service. It runs when the address box loses focus (only if the position is still empty) and from a "Find on map" button. It shows what it found, with a link to check it and the OpenStreetMap credit. Used for suppliers, the brand profile (now one "Map position" box instead of two) and journey stops. The lookup runs server-side, for logged-in producers only, through `src/lib/geocode.ts`.
- **Bias towards the brand:** up to five matches are fetched, and the search's top-ranked match within the brand's area wins (`closestMatch`). The area is the brand's map position, or its town looked up. Plain "surrey" from a Port Moody brewery gives Surrey, BC, not Surrey, England.
- **Policy:** at most one request per second per server, an identifying User-Agent, results cached (500 addresses), and the OpenStreetMap credit shown. Browser tests point `GEOCODER_URL` at a dead port, so they never call the public service.
- **Supersedes:** the plan's default "no geocoding service" (Milestone 0 defaults). The product owner asked for it after trying the supplier form.
- **Alternatives:** Mapbox or Google geocoding (better results, but a paid key and account); a self-hosted Nominatim (set `GEOCODER_URL` if traffic grows past the public service's limits).
- **Why:** typing coordinates was the slowest part of the forms. Nominatim is free, needs no key or new package, and uses the same map data as the planned story page map. A suggestion is always shown for the producer to check, because an address search can pick the wrong place.

---

## Milestone 4

### 2026-10-25 · Public access through row-level security, not a second database user
- **Choice:** story pages use the same restricted role with `app.public = 'on'` (`withPublic`). Read-only policies allow only published batches and what their story shows. Scans are insert-only.
- **Alternatives:** a separate public database role; the service role with app-level filtering.
- **Why:** one connection pool and one mental model. The database itself enforces "public pages expose only published batch data", and a test proves it. Inserting scans uses `createMany` because `create` reads the row back, which the public is not allowed to do.

### 2026-10-25 · Story page wording where the mockup needs data we don't have
- **Choice:** the headline is "{Brewed} by {first person's first name} in {brand location}." There is no "a mile from where you're standing", "Best within", farming methods or "Visit the taproom".
- **Why:** those need the shopper's location or fields Rootline does not record, and the brief says not to invent features. Each is easy to add once its data exists.

### 2026-10-25 · Map: Leaflet + OpenStreetMap tiles, framed on the local route
- **Choice:** one client component (`RouteMap`) loads Leaflet after the page. It opens on the journey stops; a "Show the farms too" button zooms out to the sources. Tiles are softened with a CSS filter to fit the palette. Without JavaScript, the stop list carries the story.
- **Alternatives:** fit everything at once (farms hours away made the stops overlap); a static map image (needs a tile service or image provider).
- **Why:** it matches the mockup's local "field to fridge" view, keeps the page fast (the text is not blocked by the map) and can be swapped for Mapbox later. Note: OpenStreetMap's tile servers allow light use only; heavy traffic should move to a tile provider.

### 2026-10-25 · Scans recorded after the response (`after()`)
- **Choice:** the story page counts a scan in `after()`, with `via=shelf` when it came through a shelf code. The location comes from Vercel geo headers only.
- **Why:** a shopper never waits for analytics, and a failed count is logged rather than breaking the page. No IP is stored, for privacy.

### 2026-10-25 · Brewery demo seed brought forward
- **Choice:** `npm run db:seed` creates Cedar & Tide (batch 214 at `/b/cedarpm2`) and a demo login now. The other industries follow in M9.
- **Why:** the story page needs a published batch with realistic data to review.
