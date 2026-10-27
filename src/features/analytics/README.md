# Analytics feature

Counts QR scans. Each view of a story page (`/b/{code}`) is one scan, recorded with the batch, the time, whether it came from a batch code or a shelf code, and a rough location.

**Status:** recording (Milestone 4) and counting (Milestone 6) are built. Counts appear on the dashboard and on each batch page.

## Main files

| File | What it does |
|---|---|
| `service.ts` | `coarseLocation(headers)`: country, region and city from Vercel's geo headers, or nothing locally. `scanSource()` |
| `server/queries.ts` | `scansByDay` (daily counts in the brand's time zone, zero-filled), `topBatchesByScans`, `totalScans` |
| `server/record-scan.ts` | `recordScan`: inserts one `scan_event`. Called with `after()`, so it never slows the page; failures are logged as warnings |

## Data

The **`scan_event`** table: `batch_id`, `via` (BATCH/SHELF), `scanned_at`, `country`, `region`, `city`.
- **No IP address is ever stored**, only the coarse place Vercel derives from it.
- The public may insert scans of published batches (`createMany`, which does not read the row back) but cannot read them.
- The brand can read its own batches' scans.

## Time zones

Prisma stores times as UTC in columns without a time zone. Queries therefore mark them as UTC and then convert them: `(scanned_at AT TIME ZONE 'UTC') AT TIME ZONE <brand zone>`. Without the first step, Postgres treats the stored time as local time, and scans after about 5pm in Vancouver landed on "tomorrow" and vanished from the dashboard. `tests/scans.db.test.ts` checks scans either side of midnight.

## Known limitations

- Every page view counts, including reloads and link previews. There is no deduplication in the MVP.
- Locally there are no geo headers, so the location is empty.

## How to test

- Unit: `npx vitest run src/features/analytics` (`fillDays`, `percentChange`, `weekTotals`)
- Security: `npm run test:db` (scans are write-only for the public)
- Browser: `tests/e2e/shopper-scans-story.spec.ts` checks a scan is saved
