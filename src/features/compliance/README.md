# Compliance feature

Per-batch exports for inspectors, retailers and food-safety audits. Each batch page has **Download PDF** and **Download CSV**. Both contain the same facts:
- **Details:**
  - brand and location;
  - product, format and industry fields (e.g. alcohol %);
  - batch number, code and status;
  - made and packaged dates, named by the template ("Brewed", "Canned");
  - ingredients and allergens.
- **Supplier lots:** supplier, type, what was supplied, lot number, address and map position.
- **Journey stops:** name, type, address, map position, date and note, in order.

## Main files

| File | What it does |
|---|---|
| `service.ts` | `buildComplianceRecord` (one record feeds both formats), `toCsv`, `csvCell`. Pure, unit tested |
| `pdf.ts` | `compliancePdf`: a simple A4 PDF with pdf-lib; adds pages as needed and numbers them |
| `server/record.ts` | `loadComplianceRecord`: gathers the batch, product, suppliers and brand through their own features |

Route: `GET /batches/{id}/export?format=csv|pdf` (owner only; another brand's batch gives 404). Each export is logged with the requestId.

## CSV details

- The file starts with label/value rows, then a "Supplier lots" table, then a "Journey stops" table, separated by blank rows.
- It has a UTF-8 byte-order mark, so Excel shows accented characters correctly.
- **Safe to open in a spreadsheet:** text starting with `=`, `+`, `-` or `@` gets a leading `'`, so a supplier name can never run as a formula (CSV injection). Numbers, such as map positions, are left as numbers.

## Known limitations

- Certificates and recall history are not in the export. The brief lists product, dates, lots, suppliers and stops; they are easy to add.
- The PDF uses built-in Helvetica, so characters outside Western European ones are replaced with "?".

## How to test

- Unit: `npx vitest run src/features/compliance`
- Browser: `npx playwright test tests/e2e/compliance.spec.ts`
