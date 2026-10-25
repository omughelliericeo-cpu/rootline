# Suppliers feature

The farms and businesses a brand buys from, each entered once: name, type (from the industry template, e.g. "Hop farm"), what they supply, address and map position. Every journey starts at a named supplier and lot (lots are recorded on batches in M3), so suppliers are the first stops on the story page map.

## Main files

| File | What it does |
|---|---|
| `schema.ts` | Zod schema for the supplier form; turns the pasted map position into numbers |
| `service.ts` | `parseCoordinates` ("50.4148, -119.1937" → numbers), `formatCoordinates` |
| `server/queries.ts` | `listSuppliers`, `getSupplier` (returns null when not found) |
| `server/actions.ts` | `createSupplier`, `updateSupplier`, `deleteSupplier` |
| `components/` | `SupplierForm`, `SupplierList`, `DeleteSupplier` |

Pages: `src/app/(producer)/suppliers/` (list, `new`, `[supplierId]`).

## Data

The **`supplier`** table: `brand_id`, `name`, `source_type` (a template `sourceTypes` id), `supplies`, `address`, `latitude`, `longitude`. Row-level security limits rows to the owner's brand.

## Rules

- The type must be one of the brand's template `sourceTypes`. This is checked in the action, and a `ValidationError` is shown next to the field.
- The map position is one "latitude, longitude" field. It is suggested from the address (OpenStreetMap lookup, see `src/lib/geocode.ts`) when the address box loses focus, or with "Find on map". It can also be pasted from a map app.
- A supplier with certificates cannot be deleted (`IN_USE`) until those certificates are removed. Later, lots on batches will also block deletion.

## Connections

- Uses `industries` for source types.
- `certificates` lists suppliers in its "Covers" choice.
- `batches` (M3) will use suppliers for lots.

## How to test

- Unit: `npx vitest run src/features/suppliers`
- Browser: `npx playwright test tests/e2e/catalogue.spec.ts`
