# Industries feature

Rootline is one engine for every small-batch producer: food, drink and cosmetics. This feature holds the **industry templates** that change the engine's words, extra fields, dates, badges and default journey stops. It has no screens or database tables of its own. Every other feature reads from it.

## Main files

| File | What it does |
|---|---|
| `template.schema.ts` | The one Zod schema every template must pass |
| `templates/*.ts` | One file per industry: `brewery` (the polished one), `poultry`, `produce` (fruits & vegetables), `coffee`, `winery`, `cosmetics` (cosmetics & skincare), `other` ("Something else": honey, preserves, sauces and more) |
| `templates/index.ts` | The list of templates (also the order of the sign-up dropdown) |
| `registry.ts` | `getTemplate(id)`, `industryOptions()`, `industryIdSchema`, `industryPhotoUrl(id)`. Templates are validated once when the module loads |
| `choices.ts` | `industryChoices()`: how industries appear as "What do you make?" cards. Brewery and winery share one card and stay separate templates |
| `components/IndustryCards.tsx` | The photo cards: radio buttons in sign-up, links on the home page. Photos: `public/photos/industries/{id}.jpg` |
| `service.ts` | `freshnessLabel()` ("Canned 9 days ago"), `extraFieldsSchema()` (validates `extra` JSON columns), `optionLabel()` |
| `index.ts` | Public surface. Import from `@/features/industries` only |

## What a template defines

- `labels`: place, maker, product(s), batch(es), e.g. "Brewery / Brewer / Beer / Brew".
- `sourceTypes`: the kinds of supplier, e.g. hop farm, maltster.
- `productFields`, `batchFields`: industry-only fields (text, number, select or date). They are stored in the `extra` JSON column of products and batches and validated by `extraFieldsSchema()`.
- `dates`: labels for the two shared date columns (`madeAt`, `packagedAt`). `packaged: null` hides the second date. `made.byVerb` (optional) replaces the date label in the story headline when it would read wrongly next to a person: poultry says "Collected by Ana", not "Laid by Ana".
- `freshness`: which date to count from, and the wording style:
  - `daysAgo`: "Canned 9 days ago"
  - `timeToday`: "Baked at 5am today"
  - `year`: "Vintage 2024"
- `allowedBadges`: the only claims that may ever become badges, and only with a valid certificate.
- `defaultStopTypes`: the stop types offered for each journey stop, in their usual order ("Add another address" picks the next one).
- `ownStopType`: which of those stops is the producer's own place. On a brand's first batch it is pre-filled with the brand's name and location.
- `name` and `description`: shown on the "What do you make?" card.
- `starterIngredients`, `starterAllergens`, `dietaryTags`: pick-lists for products.

## Adding a new industry

1. Copy an existing file in `templates/`, e.g. `cp templates/coffee.ts templates/cidery.ts`, and edit it. The `id` must match the file name.
2. Add it to the list in `templates/index.ts`.
3. Add its card photo as `public/photos/industries/<id>.jpg` (3:2 landscape).
4. Add a demo brand to `prisma/seed/brands-*.mts` so its story page can be seen with `npm run db:seed`.
5. Run `npm test`. `tests/templates.test.ts` checks every template automatically: it passes the schema, has unique ids and is registered. Add a test for anything special, such as its freshness wording.

No other code changes are needed. `Brand.industry` is a plain string, not a database enum, so no migration is needed either.

*Note:* step 2 is one extra line beyond "one file". A test fails if you forget it. There is no reliable automatic file discovery in Next.js bundles, so the explicit list is the simplest safe option.

## Rules

- **No industry `if/else` anywhere in the app.** If a feature needs to behave differently per industry, add a template property for it instead.
- Freshness "days" are calendar days in the brand's time zone (`Brand.timezone`, default America/Vancouver).

## Connections

Used by: `auth` (the sign-up dropdown), `brand` (labels). Later also `products`, `batches`, `certificates` and `story-page`.

## Known limitations

- Wording is English only.
- Templates are code, not database rows, so changing one needs a deploy. This is deliberate: templates are reviewed and tested.

## How to test

`npx vitest run src/features/industries`
