# Analytics feature

Counts QR scans. Each view of a story page (`/b/{code}`) is one scan, recorded with the batch, the time, whether it came from a batch code or a shelf code, and a rough location.

**Status:** recording is built (Milestone 4). Counts per batch and per day, shown on the dashboard, arrive in Milestone 6.

## Main files

| File | What it does |
|---|---|
| `service.ts` | `coarseLocation(headers)`: country, region and city from Vercel's geo headers, or nothing locally. `scanSource()` |
| `server/record-scan.ts` | `recordScan`: inserts one `scan_event`. Called with `after()`, so it never slows the page; failures are logged as warnings |

## Data

The **`scan_event`** table: `batch_id`, `via` (BATCH/SHELF), `scanned_at`, `country`, `region`, `city`.
- **No IP address is ever stored**, only the coarse place Vercel derives from it.
- The public may insert scans of published batches (`createMany`, which does not read the row back) but cannot read them.
- The brand can read its own batches' scans.

## Known limitations

- Every page view counts, including reloads and link previews. There is no deduplication in the MVP.
- Locally there are no geo headers, so the location is empty.

## How to test

- Unit: `npx vitest run src/features/analytics`
- Security: `npm run test:db` (scans are write-only for the public)
- Browser: `tests/e2e/shopper-scans-story.spec.ts` checks a scan is saved
