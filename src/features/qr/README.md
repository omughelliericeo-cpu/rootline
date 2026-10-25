# QR feature

QR codes that shoppers scan with their phone camera (no app needed).
- **Batch codes**: one per batch, pointing to `/b/{code}`. The code is a random 8-character value stored on the batch.
- **Shelf codes**: reusable codes for a tap, fridge or stall, pointing to `/s/{code}`. The producer repoints them to whichever batch is on sale, so a printed code never needs replacing. Scanning one will redirect to that batch's story page (M4).

Every code downloads as **PNG** (1024 px), **SVG** (any size), or an **A4 sticker sheet PDF**: 21 labels in the standard 63.5 × 38.1 mm layout (e.g. Avery L7160), each with the QR, the batch name, the brand and "Scan to see where it came from".

## Main files

| File | What it does |
|---|---|
| `service.ts` | Link building, download file names, the sticker sheet layout, PDF-safe text |
| `server/render.ts` | SVG/PNG with `qrcode`; the sticker PDF with `pdf-lib` |
| `server/download.ts` | The HTTP response for a download |
| `server/shelf-codes.ts` | `listShelfCodes`, `getShelfCode` |
| `server/actions.ts` | `createShelfCode`, `pointShelfCode`, `deleteShelfCode` |
| `components/` | `QrCard` (QR + downloads), shelf code list and forms |

Routes: `GET /batches/{id}/qr?format=png|svg|pdf` and `GET /shelf-codes/{id}/qr?format=…` (owner only). Page: `/shelf-codes`.

## Rules

- Codes use `23456789abcdefghjkmnpqrstuvwxyz`, which avoids letters easily misread on a label (0/o, 1/l/i). They are created by `src/lib/codes.ts` and never reused. If a new code clashes with an existing one, the action retries.
- QR codes are dark ink on white with a quiet zone and medium error correction, for reliable scanning.
- A shelf code can only point to a batch of the same brand. This is checked in the action, because foreign keys skip row-level security.

## Data

The **`shelf_code`** table: `code` (unique), `label`, `batch_id` (optional; set to empty if the batch is deleted). Row-level security limits it to the owner's brand.

## Known limitations

- The sticker sheet repeats one code 21 times. There is no mixed sheet of different batches yet.
- PDF text uses the built-in Helvetica font, which only covers Western European characters; others are replaced with "?".

## How to test

- Unit: `npx vitest run src/features/qr`
- Browser: `npx playwright test tests/e2e/new-batch.spec.ts` (downloads every format)
