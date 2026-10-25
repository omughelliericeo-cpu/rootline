# Products feature

A product is something the brand makes again and again (e.g. "Hazy Pale Ale, 473 ml can"). It holds the name, format, ingredients (in label order), allergens, dietary tags, an optional photo, and the industry's extra fields (e.g. alcohol % for beer, grade and size for eggs). Each batch (M3) is one run of a product, so new batches are quick to create.

## Main files

| File | What it does |
|---|---|
| `schema.ts` | Zod schema for the product form (extra fields arrive as `extra.*`) |
| `service.ts` | `mergeList` (tick-boxes + "other" text → one list), `splitKnown` (the reverse, for editing), `unknownTags`, `prefixFieldErrors` |
| `server/queries.ts` | `listProducts`, `getProduct` (returns null when not found) |
| `server/actions.ts` | `createProduct`, `updateProduct`, `deleteProduct` |
| `components/` | `ProductForm`, `ProductList`, `DeleteProduct` |

Pages: `src/app/(producer)/products/` (list, `new`, `[productId]`). Headings use the template's words ("Beers", "Bakes", "Coffees"...).

## Data

The **`product`** table: `name`, `format`, `ingredients[]`, `allergens[]`, `dietary_tags[]`, `photo_path` (brand-media bucket), and `extra` (JSON). `extra` is validated with `extraFieldsSchema(template.productFields)` from the industries feature; unknown keys are dropped. Row-level security limits rows to the owner's brand.

## Rules

- The tick-boxes come from the template (`starterIngredients`, `starterAllergens`, `dietaryTags`). Anything else can be typed in "Other", separated by commas.
- Duplicates are removed, ignoring case.
- Dietary tags must be from the template's list.
- Required template fields (e.g. beer's alcohol %) must be filled in.
- A product with certificates cannot be deleted (`IN_USE`). Later, batches will block it too.

## Connections

- Uses `industries` for pick-lists, extra fields and words.
- `certificates` lists products in "Covers".
- `batches` (M3) and `story-page` (M4) read products.

## Known limitations

- A photo can be replaced but not removed without replacing it.
- Ingredient order follows the tick-box order, then typed items. Re-ordering needs editing the "Other" text.

## How to test

- Unit: `npx vitest run src/features/products`
- Browser: `npx playwright test tests/e2e/catalogue.spec.ts`
