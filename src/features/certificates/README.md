# Certificates feature

The trust feature. A claim such as "Organic" or "B Corp" is shown as a badge **only while a valid, unexpired certificate file is on file**. A certificate has a claim, an issuer, an expiry date and a file, and it covers the whole brand, one product, or one supplier.

## The rule (service.ts)

`isCertificateValid(certificate, now, timeZone)` is true only when **all** of these hold:
- `status` is `VALID` (not revoked by the producer);
- a file is stored;
- today, in the brand's time zone, is on or before `expiresOn`. The certificate is valid through the whole of its expiry day.

Validity is **computed every time** and never stored as a flag, so a certificate stops counting at midnight after its expiry date without any job running.

`visibleBadges(certificates, template.allowedBadges, now, timeZone)` returns the badges to show:
- only claims with a valid certificate;
- only claims the industry template allows (a winery's VQA can never appear on a beer);
- each claim once, in the template's order.

The story page (M4) will call it with the brand's, the product's and the batch's suppliers' certificates.

Other helpers: `certificateState` (valid / expiring within 30 days / expired / revoked / missing-file), `daysUntilExpiry`, `stateLabel`, `parseScope` / `scopeValue` for the "Covers" choice.

## Main files

| File | What it does |
|---|---|
| `service.ts` | The rules above. Pure functions, unit tested |
| `schema.ts` | Zod schema for the upload form |
| `server/queries.ts` | `listCertificates`, `certificateFileUrl` (short-lived signed link) |
| `server/actions.ts` | `uploadCertificate`, `revokeCertificate`, `deleteCertificate` |
| `components/` | `CertificateForm`, `CertificateList`, `CertificateActions` |

Pages: `src/app/(producer)/certificates/` (list, `new`) and `GET /certificates/{id}/file`, which redirects the owner to a signed link valid for 5 minutes.

## Data

- The **`certificate`** table: `claim` (a template `allowedBadges` id), `issuer`, `expires_on` (date only), `status` (VALID/REVOKED), `file_path`, `file_name`, `file_type`, and optional `product_id` or `supplier_id`.
- A database check stops a certificate covering both a product and a supplier.
- Files are in the **private** `certificates` bucket (`npm run storage:setup`). They are never publicly reachable; only signed links are.

## Rules and error codes

- `CERT_CLAIM_NOT_ALLOWED` / field error: the claim must be in the template's `allowedBadges`.
- `CERT_EXPIRED`: you cannot upload a certificate whose expiry date has already passed.
- The covered product or supplier must belong to the same brand. This is checked explicitly, because foreign keys are not filtered by row-level security.
- Files must be PDF, JPG, PNG or WebP, up to 4 MB.
- Products and suppliers with certificates cannot be deleted until the certificates are removed. Deleting a whole brand still removes everything.

## Known limitations

- There is no Rootline admin review: a certificate counts as soon as it is uploaded. This was agreed in the plan.
- A certificate cannot be edited. Upload a new one and delete or revoke the old one.

## How to test

- Unit (validity, expiry day, revoked, allowed claims): `npx vitest run src/features/certificates`
- Security: `npm run test:db`
- Browser: `npx playwright test tests/e2e/catalogue.spec.ts`
