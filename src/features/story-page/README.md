# Story page feature

The public page shoppers see when they scan a batch's QR code: `/b/{code}`. There is no login and no app. It's mobile first, and everything except the map is server-rendered, so it works without JavaScript.

## What it shows (top to bottom)

1. **Brand bar** (logo, name, location) and a **hero photo**: the product photo, otherwise the brand's first photo.
2. **"Brew 214 · Hazy Pale Ale"** and a headline: "Brewed by Jess in Port Moody, BC." It uses the template's made-date word, the first person's first name and the brand's location.
3. **Freshness line** from the template ("Canned 9 days ago", "Baked at 5am today", "Vintage 2024"), and a note when the batch is sold out.
4. **Verified badges.** Only claims backed by a currently valid certificate for the brand, this product, or a supplier whose lot went into this batch (`storyBadges`). Each badge opens its certificate.
5. **Where it came from:** the map (`RouteMap`), then the sources (supplier lots) and the numbered stops. Each entry expands to show lot numbers, address, date and note.
6. **What went into it:** "Four ingredients. Nothing hidden.", allergens, where each ingredient came from, dietary tags.
7. **The people behind your beer:** portraits, the quote (credited to the first person) and the video link.
8. **Share this story** (the phone's share sheet, or copy link).

## The map (`components/RouteMap.tsx`)

- **The only file that uses Leaflet.** To switch to Mapbox, rewrite just this component.
- **What it draws:** OpenStreetMap tiles, softened towards the cream palette in `globals.css`, with numbered stop markers, small source markers, dotted lines between stops, and dashed lines from each source to the first stop.
- **Framing:** it opens on the route itself; "Show the farms too" zooms out to include the sources.
- **Loading:** it loads after the page is shown. Without JavaScript the box shrinks to a note, and the list below tells the same story.
- **Safety:** marker pop-ups use text nodes, never HTML, so a producer's text cannot inject markup.

## Main files

| File | What it does |
|---|---|
| `service.ts` | `buildStory` (everything the page shows), `storyBadges`, `ingredientsHeading`. Pure, unit tested |
| `journey.ts` | Sources grouped by supplier, numbered stops, map points |
| `server/queries.ts` | `loadStory(code)`: reads in public mode (`withPublic`) |
| `server/certificate.ts` | The certificate viewer behind each badge (5-minute signed link, only for valid certificates in this story) |
| `server/shelf-redirect.ts` | `/s/{code}` → the batch the shelf code points at |
| `components/` | `StoryPage` and its sections, `RouteMap`, `ShareButton` |

Routes:
- `src/app/(public)/b/[code]/page.tsx`: the story page. It records a scan after the response.
- `…/b/[code]/certificates/[certificateId]/route.ts`: the certificate viewer.
- `…/s/[code]/route.ts`: shelf codes. It redirects with a 307 to `/b/{code}?via=shelf`.

## Security

Public pages read through `withPublic()`. The `story_page_public_access` migration adds read-only policies that only let through:
- LIVE or SOLD_OUT batches;
- their brand, people, product, lots, suppliers and stops;
- VALID certificates that are not long expired.

Drafts, other products, scan counts and (later) recall emails are never readable. The public can add a scan of a published batch, but never read scans back. `src/lib/tests/public-read.db.test.ts` proves all of this.

## Performance

Measured on the production build with simulated mobile 4G (1.6 Mbit/s, 150 ms) and a 4× slowed CPU: content painted in about 1.2 s (about 2.0 s on the very first request after the server starts). The hero image uses `priority`; the map and its tiles load after the page.

## Known limitations

- The mockup's "a mile from where you're standing" needs the shopper's location, so the headline names the brand's town instead.
- "Best within N days", farming methods and "Visit the taproom" are not shown, because those details are not recorded yet.
- The recall sign-up button arrives with Milestone 5.
- Batches have no hero photo of their own.

## How to test

- Unit: `npx vitest run src/features/story-page`
- Security: `npm run test:db`
- Browser: `npx playwright test tests/e2e/shopper-scans-story.spec.ts`
- By hand: `npm run db:seed`, then open http://localhost:3000/b/cedarpm2 on a phone-sized window.
