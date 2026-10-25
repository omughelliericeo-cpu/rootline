# Brand feature

The producer's brand profile: name, location, map position, brand colours, logo, photos, quote, an optional YouTube/Vimeo link, and the people shown under "Meet the maker". Everything here appears on the public story page (Milestone 4).

## Main files

| File | What it does |
|---|---|
| `schema.ts` | Zod schemas for every brand form |
| `service.ts` | Rules: allowed video hosts, photo limit (8), people ordering, safe photo removal |
| `server/queries.ts` | `getBrandProfile`, `createBrandForOwner` (used at sign-up), `findBrandIdForOwner` |
| `server/profile-actions.ts` | Save details, upload/remove logo, add/remove photos |
| `server/people-actions.ts` | Add, edit and remove people |
| `src/lib/media-cleanup.ts` (shared) | Removes files that are no longer used. If a save fails after an upload, the new file is deleted again |
| `components/` | `BrandProfileForm`, `LogoUpload`, `PhotoGallery`, `PeopleList` |

The page is `src/app/(producer)/brand/page.tsx`.

## Data

- **`brand`** table: one row per producer. Images are stored as storage *paths* (`logo_path`, `photo_paths`), not URLs. `publicMediaUrl()` builds the URL when rendering, so the storage host can change.
- **`brand_person`** table: the people, ordered by `position`.
- **Files**: the public Supabase Storage bucket `brand-media`, under `{brandId}/{logo|photo|person}/{random}.{ext}`. Run `npm run storage:setup` once per Supabase project to create it.

Row-level security limits every query to the owner's own brand (see the migration and `src/lib/tests/rls.db.test.ts`).

## Rules

- Images must be JPG, PNG or WebP under 4 MB (`src/lib/storage-rules.ts`). SVG is refused because it can carry scripts.
- A photo can only be removed if its path is in this brand's list, so a forged request cannot delete another brand's file.
- Video links must be `https://` YouTube or Vimeo links. Rootline does not host video.

## Connections

- Uses `industries` for the place/maker words.
- `auth` calls `createBrandForOwner` at sign-up.
- Later, `story-page` reads the profile and `tips` reads the people.

## Known limitations

- People cannot be re-ordered yet; they appear in the order they were added.
- The map position is one "latitude, longitude" field, suggested from the location with "Find on map".
- An image whose replacement or removal fails to delete is left in storage. A warning is logged.

## How to test

- Unit: `npx vitest run src/features/brand`
- Security: `npm run test:db`
- Browser: `npx playwright test tests/e2e/producer-brand.spec.ts`
