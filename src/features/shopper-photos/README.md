# Shopper photos feature

Shoppers can share a photo from a story page ("Share your photo"). The producer approves each one before it appears under "From people who've tried it".

## How it works

1. **Shopper** (no account): uploads a photo, with an optional note (up to 280 characters) and an optional first name, and ticks the consent box. The exact consent wording, which names the brand, is stored with the photo.
2. **On the phone:** the photo is shrunk to at most 2000 px and re-saved as JPEG (`src/ui/shrinkImage.ts`). This keeps uploads fast and under 4 MB, and also drops the photo's metadata. Without JavaScript, the original file is sent.
3. **On the server** (`server/share-action.ts`):
   - the hidden "website" trap field catches bots, which get the normal thank-you message;
   - an in-memory limit allows 5 shares per visitor per 15 minutes (`src/lib/rate-limit.ts`; the address is never stored);
   - the file type and size are checked;
   - **metadata is removed** (`src/lib/image-metadata`: EXIF/GPS, XMP, comments, PNG text, WebP EXIF/XMP; the orientation is kept);
   - the photo is uploaded to the **private** `shopper-photos` bucket;
   - a `PENDING` row is inserted.
4. **Producer** (`/shopper-photos`, with the waiting count shown in the menu):
   - **Approve** copies the file to the public `brand-media` bucket (same path), marks the row `APPROVED` and deletes the private copy.
   - **Reject** deletes the row and the file.
   - **Remove** (for approved photos) deletes the row and the public file.
5. **Story page:** shows up to 12 approved photos, newest first, with the first name only. "Sam Okafor" becomes "Sam"; no name becomes "A shopper".

## Database rules (row-level security, migration `shopper_photos`)

- The public may only **insert** `PENDING` photos, for a LIVE or SOLD_OUT batch and that batch's own brand. The insert is refused once 50 photos are waiting on the batch, via the `shopper_photo_pending_count` security-definer function.
- The public may only **read** `APPROVED` photos of published batches.
- A brand reads and moderates only its own photos.

No email address, IP address or account is stored.

## Main files

| File | What it does |
|---|---|
| `service.ts` | Consent wording, first-name rule, bot trap, limits. Pure, unit tested |
| `schema.ts` | Zod schemas for sharing and reviewing |
| `server/share-action.ts` | Public share action |
| `server/review-actions.ts` | Approve, reject, remove |
| `server/queries.ts` | Review lists (waiting photos through 10-minute signed links) and the waiting count |
| `components/ShopperPhotosSection.tsx` | Story-page section and form |
| `components/ShopperPhotoInbox.tsx` | Producer review page |

## Known limitations

- The rate limit lives in memory, so it resets on a restart and is separate on each server instance. The database cap of 50 waiting photos per batch is the hard limit.
- HEIC photos are not accepted. iPhones convert to JPEG when uploading through a browser, so this rarely matters.
- There is no CAPTCHA. Add one (a new dependency) if spam gets past the trap field, the rate limit and approval.

## How to test

- Unit: `npx vitest run src/features/shopper-photos src/lib/tests/image-metadata.test.ts src/lib/tests/rate-limit.test.ts`
- Database: `npx vitest run --config vitest.db.config.mts src/features/shopper-photos`
- Browser: `npx playwright test tests/e2e/shopper-photos.spec.ts`
