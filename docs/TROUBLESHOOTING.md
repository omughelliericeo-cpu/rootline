# Troubleshooting

Start with the four tools below. Most problems can be found in a few minutes.

## 1. The health check

Open `/api/health` (locally: http://localhost:3000/api/health).

```json
{
  "status": "degraded",
  "requestId": "req_5f9a39486259",
  "checks": {
    "database": { "status": "ok", "latencyMs": 204 },
    "storage":  { "status": "not_configured" },
    "email":    { "status": "error", "message": "HTTP 401 from api.resend.com" }
  }
}
```

| Overall status | Meaning |
|---|---|
| `ok` | Every service answered |
| `degraded` | The database is fine, but storage or email is failing or not configured. Pages load, but uploads or emails may fail |
| `down` (HTTP 503) | The database cannot be reached. Nothing works |

A check that says `not_configured` means its environment variables are empty. See the README.

## 2. The requestId

Every request gets an id like `req_5f9a39486259`. You can find it in four places:
- every error result returned by a server action (`error.requestId`)
- the error screen in the browser, labelled **Reference**
- the `x-request-id` response header (browser dev tools → Network)
- every log line written while handling that request.

When someone reports a problem, ask for the **Reference** (and the **Error code**, if shown), then search the logs for it.

## 3. The logs

Logs are one JSON object per line. Each line includes `timestamp`, `level`, `message`, `feature`, `action`, `requestId`, `brandId` (once known) and `durationMs`.

- **Locally:** they print in the terminal running `npm run dev`. To filter, run `npm run dev 2>&1 | grep req_5f9a39486259`.
- **On Vercel:** go to Project → Logs and search for the requestId.

A server action always writes `action started`, then either `action succeeded`, `action failed` (an expected problem, with a `code`) or `action crashed` (a bug, with the error and stack).

Set `LOG_LEVEL=debug` for more detail, or `warn` for less.

### Error screen shows an "Error code" (digest)
In production, Next.js hides server error details from the browser and shows a short digest instead. Search the logs for that digest: the `request crashed` line has the same `digest` along with the full error, path and requestId.

## 4. Sentry

When `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` are set, unexpected errors go to Sentry, tagged with `feature`, `action` and `requestId`. In Sentry, search `requestId:req_5f9a39486259` to find the issue that matches a log line. Expected failures (validation, not found) are logged but not sent to Sentry.

## Common problems

| Symptom | Likely cause | Fix |
|---|---|---|
| `Invalid environment configuration: DATABASE_URL ...` | `.env` is missing or a value is malformed | `cp .env.example .env` and fill it in. The message names the variable |
| Health says `database: error` / `ECONNREFUSED` | Postgres is not running or the URL is wrong | Start Postgres. Check the host, port, user and password in `DATABASE_URL` |
| `database "rootline" does not exist` | Database not created yet | `psql -U postgres -c "CREATE DATABASE rootline;"` |
| `Cannot find module '@/generated/prisma/client'` | Prisma client not generated | `npm run db:generate` (also runs on `npm install`) |
| Lint error "Import another feature through its index.ts" | Deep import into another feature | Import from `@/features/<name>`. Export what you need from that feature's `index.ts` |
| Lint error "Only a feature's server/ folder may access the database" | Database used from a component or service | Move the query into `src/features/<name>/server/` |
| Playwright says the browser is not installed | First run on this machine | `npx playwright install chromium` |
| Playwright cannot start its server | Port 3100 is busy, or the build failed | Stop the other process on 3100. Run `npm run build` to see build errors |
| Every page shows "No brand is set up for this account" (`BRAND_NOT_FOUND`) | A Supabase user exists without a `brand` row (e.g. created by hand in the Supabase dashboard) | Delete the user in Supabase and sign up through `/signup`, or insert a brand row for them |
| Queries return nothing, or saves fail with "new row violates row-level security policy" | Code ran a query outside `withTenant()`, or with the wrong ids | Wrap the query in `withTenant({ userId, brandId }, ...)`. Run `npm run test:db` |
| `password authentication failed for user "rootline_app"` | The app role has no password on this machine yet | `psql -U postgres -d rootline -c "ALTER ROLE rootline_app WITH LOGIN PASSWORD 'rootline_app_dev';"` |
| `permission denied for table ...` as rootline_app | A table was created outside a migration (no grants) | Create tables only through `npm run db:migrate`. The default privileges grant access to new tables |
| Sign-up says "Too many attempts" (`AUTH_RATE_LIMITED`) | Supabase's built-in email sender limit (a few per hour) | Wait, or set up custom SMTP in Supabase → Authentication → SMTP Settings |
| Confirmation link goes to `/login?error=confirm` | Link expired, already used, or opened in a different browser | Sign up again with the same email to resend. Change the email template as described in the README so other devices work |
| Confirmation email links to the wrong site | Supabase Site URL / Redirect URLs not set | Supabase → Authentication → URL Configuration. See the README |
| Upload fails with `UPLOAD_FAILED` | Bucket missing or wrong Supabase keys | `npm run storage:setup`, then check `/api/health` → storage |
| Images do not show (broken image icon) | `NEXT_PUBLIC_SUPABASE_URL` missing at build time | Set it and rebuild: next.config.ts uses it to allow the storage host |
| `Cannot read properties of undefined (reading 'findMany')` on a new page | The dev server was started before the latest migration, so it holds an old database client | Stop `npm run dev` and start it again after `npm run db:migrate` |
| Pages keep reloading by themselves in `npm run dev` (forms such as login never submit) | Next's dev MCP server or browser log forwarding was switched back on; each write to `.next/dev/logs/next-development.log` triggers a reload | Keep `experimental.mcpServer: false` and `logging.browserToTerminal: false` in next.config.ts, then restart `npm run dev` |
| "This product has certificates on file" / "This supplier has certificates on file" (`IN_USE`) | Deleting would orphan certificates | Delete or move the certificates first (Certificates page) |
| Certificate upload says it has already expired (`CERT_EXPIRED`) | The expiry date is in the past, in the brand's time zone | Upload the current certificate |
| A badge does not show | Certificate revoked, expired, file missing, or the claim is not one of the industry's allowed badges | Check its status on the Certificates page. The rules are in src/features/certificates/README.md |
| "View certificate" gives 404 | The certificate belongs to another brand or was deleted | Log in as the right owner. Links are signed and expire after 5 minutes, so open them from the list again |
| Playwright tests are slow to start | They build the app first (production build in .next-e2e) | Normal: the first run takes a couple of minutes |
| **Publish** is greyed out | The batch is missing a supplier lot, a map position on a stop, or the packaged date | The status panel lists exactly what is missing. Fix it on the Lots or Journey page |
| "Published batches cannot be deleted" (`BATCH_PUBLISHED`) | Its QR code may already be printed | Use **Mark sold out** or **Take offline** instead |
| "Number N is already used for this product" | Batch numbers are unique per product | Keep the suggested number, or pick an unused one |
| "Row 2: choose a supplier…" on the lots page | That row is half filled in | Complete the row, or empty all of its boxes to skip it |
| `PageProps<"/new/route">` type error | Route types not regenerated | `npm run typecheck` (it runs `next typegen` first) |
| `npm run build` fails with "'server-only' cannot be imported from a Client Component module" | A `"use client"` component imports a feature's `index.ts` that also exports database code | Import the helper from `src/lib`, or move it there (see ARCHITECTURE "Rules") |
| Playwright web server fails with `TurbopackInternalError … generate_source_map was canceled` | A corrupted build cache | Delete `.next-e2e`. The test server now does a clean build each run |
| QR downloads return 404 | The batch or shelf code belongs to another brand, or the URL is mistyped | Open the download from the batch or shelf codes page while logged in as the owner |
| "Find on map" picks the wrong place | Several places share the name, or the address is vague | Add the town and province (or country). Check with the "Check on the map" link, or paste the position from a map app |
| "The map search is not answering right now" (`GEOCODE_UNAVAILABLE`) | OpenStreetMap's service is slow or down, rate-limited us, or `GEOCODER_URL` is wrong | Paste the position instead. Check the logs for `feature: "geocode"`. In browser tests this message is expected (the lookup is switched off on purpose) |
| A scanned code shows "This story is not available" | The batch is a draft or was taken offline, or the code is mistyped | Publish the batch (or **Back on sale**). Codes only use 2-9 and a-z without i, l, o |
| A shelf code says it is "not pointing at a batch" | It points at nothing, or at a draft | On **Shelf codes**, point it at a live batch |
| A badge is missing on the story page | The certificate expired, was revoked, covers a different product or supplier, or its claim is not allowed for the industry | Check **Certificates**. The rules are in src/features/certificates/README.md |
| "This certificate is not available" from a badge link | It stopped being valid since the page loaded | Reload the story page |
| Map stays grey | No JavaScript, a tile server problem, or no stop has a map position | The stop list below still works. Add map positions on the batch's Journey page |
| `scan not recorded` warnings in logs | The scan insert failed (e.g. database busy) | The page still worked. If it happens often, check the database and the requestId in the warning |
| "Email sending is not set up yet" (`EMAIL_NOT_CONFIGURED`) when sending a recall | No `RESEND_API_KEY` while `EMAIL_PROVIDER=resend` | Add the key, or set `EMAIL_PROVIDER=log` to try it without sending. Restart `npm run dev` after changing `.env` |
| Recall emails only reach your own address | Resend's test sender (no verified domain) | Verify a domain in Resend and set `EMAIL_FROM` to an address on it |
| "N could not be sent" after a recall | A Resend batch call failed | Search the logs for the reference (requestId) shown: the `email batch failed` line has the reason. The recall still shows on the story page |
| Story page shows "Recall notice" | A recall was sent for this batch | Intended. Every visitor sees it |
| Unsubscribe link says it is not valid | The link was cut short or mistyped | Use the full link from the email. Codes are 48 characters |
| Dashboard shows 0 scans although shoppers scanned | Scans fall outside "the last 7 days" in the brand's time zone, or a query is missing the UTC step | Check `Brand.timezone`. Raw SQL on times must use `(col AT TIME ZONE 'UTC') AT TIME ZONE tz` (see src/features/analytics/README.md) |
| Scan counts look too high | Every view counts, including reloads (no deduplication) | Expected for the MVP. Re-run `npm run db:seed` to reset the demo |
| Compliance CSV shows odd characters in Excel | The file was re-saved without its byte-order mark | Download it again from the batch page |
| A CSV cell starts with an apostrophe (') | Text beginning with = + - @ is defused so Excel will not run it as a formula | Intended. The apostrophe does not show in Excel's cell value |
| Save or Publish feels slow after typing addresses | Before M8, automatic map lookups queued in front of saves | Fixed: lookups use `GET /api/geocode`. Check `GEOCODER_URL` is not pointing at a slow server |
| Sharing a shopper photo fails with "could not be uploaded" | The `shopper-photos` bucket does not exist yet | Run `npm run storage:setup` |
| A shopper photo shows sideways | It was sent without JavaScript from an old phone with an unusual orientation tag | Rare. Rootline keeps the orientation tag; ask the shopper to share it again from a current browser |
| "This page isn't taking new photos right now" | 50 photos are waiting for review on that batch | Approve or reject some on Shopper photos |
| Home or sign-up shows plain sand-coloured boxes | The photo files are placeholders | Save real photos under the same names (see `public/photos/README.md`) |
| Every producer page crashes with "Cannot read properties of undefined (reading 'count')" | The dev server was started before a migration added a table, and keeps its old database client in memory | Stop `npm run dev` (also any leftover `next` process on port 3000) and start it again |
| A browser test cannot find a menu link on a phone-sized screen | Producer links sit inside the folded "Menu" | Use `goToMenu(page, "Suppliers")` / `logOut(page)` from `tests/e2e/support/producer.ts` |
| A replaced photo in `public/photos` still shows the old picture | Next.js's image cache in development keeps the old version | Delete `.next/dev/cache/images`, or restart `npm run dev` |
| The story test says "Canned yesterday" instead of "Canned today" (evenings only) | Test data saved with Postgres `now()` in local time while the app reads UTC | Fixed: the e2e helper sets its session to UTC. Use the same for any raw SQL fixtures |
| `npm run dev` says "Another next dev server is already running" | A previous dev server is still alive on port 3000, even after its terminal closed | Stop that process (the message shows its PID), then start again. An old server can also serve stale pages or errors after a migration |
| A demo story page shows "not found" after seeding | The seed ran against a different database than the app uses | Check `DIRECT_URL` and `DATABASE_URL` point at the same database, then run `npm run db:seed` again |
| "Something went wrong" (error code 2637629156) right after logging in | The login exists but has no brand in this database, usually because the account was created against another database that shares the same Supabase logins | Fixed: such accounts now land on "Finish setting up" (/setup) and create their brand. Long term, give production its own Supabase project |
| "Online payment isn't set up yet" on Plan & billing | No `STRIPE_SECRET_KEY` | Add a test key to `.env`, then run `npm run stripe:setup` |
| Paid in Stripe but the plan didn't change | The webhook isn't reaching Rootline, or `STRIPE_WEBHOOK_SECRET` is wrong | Locally run `stripe listen --forward-to localhost:3000/api/stripe/webhook` and use the secret it prints. Check the logs for "stripe webhook rejected" |
| "The Starter plan allows 3 live batches" | The brand is on Starter (or its trial ended) | Upgrade on Plan & billing, mark a batch sold out, or `npm run plan:set` |
| Dates in raw SQL are hours off on one machine only | A Date cast with `::timestamptz` is read in the session's time zone | Use `${date}::timestamp` (see DECISIONS) |
| Styles look unstyled (no cream background) | Tailwind config not loaded | Check that `@config "../../tailwind.config.mts"` is in `src/app/globals.css` and restart `npm run dev` |
