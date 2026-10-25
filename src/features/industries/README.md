# Industries feature

Rootline is one engine for every food and drink producer. This feature holds the **industry templates** that change the engine's words, extra fields, dates, badges and default journey stops. It has no screens or database tables of its own. Every other feature reads from it.

## Main files

| File | What it does |
|---|---|
| `template.schema.ts` | The one Zod schema every template must pass |
| `templates/*.ts` | One file per industry: `brewery` (the polished one), `bakery`, `poultry`, `coffee`, `winery` |
| `templates/index.ts` | The list of templates (also the order of the sign-up dropdown) |
| `registry.ts` | `getTemplate(id)`, `industryOptions()`, `industryIdSchema`. Templates are validated once when the module loads |
| `service.ts` | `freshnessLabel()` ("Canned 9 days ago"), `extraFieldsSchema()` (validates `extra` JSON columns), `optionLabel()` |
| `index.ts` | Public surface. Import from `@/features/industries` only |

## What a template defines

- `labels`: place, maker, product(s), batch(es), e.g. "Brewery / Brewer / Beer / Brew".
- `sourceTypes`: the kinds of supplier, e.g. hop farm, maltster.
- `productFields`, `batchFields`: industry-only fields (text, number, select or date). They are stored in the `extra` JSON column of products and batches and validated by `extraFieldsSchema()`.
- `dates`: labels for the two shared date columns (`madeAt`, `packagedAt`). `packaged: null` hides the second date.
- `freshness`: which date to count from, and the wording style:
  - `daysAgo`: "Canned 9 days ago"
  - `timeToday`: "Baked at 5am today"
  - `year`: "Vintage 2024"
- `allowedBadges`: the only claims that may ever become badges, and only with a valid certificate.
- `defaultStopTypes`: the journey stops a new batch starts with.
- `ownStopType`: which of those stops is the producer's own place. On a brand's first batch it is pre-filled with the brand's name and location.
- `starterIngredients`, `starterAllergens`, `dietaryTags`: pick-lists for products.

## Adding a new industry

1. Copy an existing file in `templates/`, e.g. `cp templates/bakery.ts templates/cidery.ts`, and edit it. The `id` must match the file name.
2. Add it to the list in `templates/index.ts`.
3. Run `npm test`. `tests/templates.test.ts` checks every template automatically: it passes the schema, has unique ids and is registered. Add a test for anything special, such as its freshness wording.

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
