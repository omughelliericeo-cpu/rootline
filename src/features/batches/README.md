# Batches feature

A batch is one production run of a product, e.g. "Hazy Pale Ale, Brew 214". It has dates, the supplier lots that went into it, and its journey stops. Each batch gets its own QR code and story page (`/b/{code}`).

## The New batch flow (under 2 minutes on a phone)

1. **Product & dates** (`/batches/new` → `createBatch`): pick the product. The number is pre-filled with the next one for that product. Then enter the made date (and time, if the template needs one) and the packaged date if the template has one. On create:
   - the **lots** are copied from the previous batch of the same product (`defaultLotsFor`);
   - the **journey stops** are copied too, without their dates (`defaultStopsFor`). A product's first batch starts with one stop, the producer's own place (`ownStopType`), filled in from the brand profile. The Journey page adds more with "Add another address" and removes them with "Remove".
2. **Lots** (`/batches/{id}/lots` → `saveLots`): check or change the supplier, what came from them and the lot number. Spare rows add more, and blank rows are ignored.
3. **Print** (`/batches/{id}/print`): the QR code, downloads (A4 sticker sheet, PNG, SVG) and the **Publish** button.

A repeat batch is: pick the product and date, check the lots, publish. The browser test times this and requires it to finish in under 2 minutes.

## Statuses

`DRAFT` → `LIVE` (publish) → `SOLD_OUT` (back on sale → `LIVE`). A `LIVE` batch can also be taken offline (→ `DRAFT`). Only drafts can be deleted: once published, its QR code may be on shelves.

**Publishing requires** (`publishProblems`):
- at least one supplier lot, because every journey starts at a named supplier and lot;
- at least one journey stop, each with an address and map position;
- the packaged date, when the freshness line counts from it (e.g. "Canned 9 days ago").

## Main files

| File | What it does |
|---|---|
| `service.ts` | Rules: next number, batch name, default lots and stops, publish checks, allowed status changes |
| `rows.ts` | Reads the repeated rows of the lots and journey forms (parallel `name[]` lists) and reports per-row problems |
| `schema.ts` | Zod schemas for the forms |
| `server/queries.ts` | `listBatches`, `getBatch`, `suggestedBatchNumber` |
| `server/actions.ts` | `createBatch`, `updateBatchDetails`, `deleteBatch` |
| `server/contents-actions.ts` | `saveLots`, `saveStops` |
| `server/status-actions.ts` | `changeBatchStatus` |
| `server/details.ts` | Turns form dates (in the brand's time zone) and industry fields into saved values |
| `server/page-data.ts` | `loadBatchPage`: owner, template and batch, or "not found" |
| `components/` | Details form, lots form, journey form, status panel, list, delete button |

Pages: `src/app/(producer)/batches/` (list, `new`, `[batchId]` with `details`, `lots`, `journey`, `print`, and `qr` for downloads).

## Data

- **`batch`**: product, unique random `code`, `number` (unique per product), `status`, `made_at`, `packaged_at`, `extra` (template `batchFields`), `published_at`.
- **`batch_lot`**: supplier, ingredient, lot number, position.
- **`route_stop`**: position, name, type (a template stop type), address, latitude/longitude (may be blank on drafts), optional date and note.

Row-level security covers all three; lots and stops are visible when their batch is. A product with batches, or a supplier used in lots, cannot be deleted (`IN_USE`).

Dates: a date without a time is stored as midday in the brand's time zone, so it reads as the same calendar day there. Templates that record a time of making have it converted exactly.

## Connections

- Uses `industries` (words, dates, fields, stops), `products`, `suppliers`, and `qr` (codes and downloads, on the pages).
- `story-page` (M4) will read published batches.

## Known limitations

- Stops are kept in the order they are listed. There is no drag-to-reorder; to move one, retype the rows.
- Map positions are suggested from the address ("Find on map") or pasted. There is no click-to-place on a map.
- A batch has no hero photo of its own; the story page will use the product photo, then the brand's first photo.

## How to test

- Unit: `npx vitest run src/features/batches`
- Security: `npm run test:db`
- Browser: `npx playwright test tests/e2e/new-batch.spec.ts`
