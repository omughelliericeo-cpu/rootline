# Dashboard feature

The producer's home page (`/dashboard`): how the brand's QR codes are doing and what needs attention. The layout takes its cues from the product owner's reference dashboard: one big number, a strong accent card, then three working cards. It is drawn in Rootline's own palette, type and square-ish corners.

## What it shows

1. **Greeting** ("Good morning, Cedar & Tide", by the brand's clock) and the **New {batch}** button.
2. **Scans this week**: the last 7 days' total, the change against the 7 days before ("+18% vs last week"), and a 14-day bar chart.
3. **Recall alert sign-ups** (the forest-green accent card): active subscribers, new this week, and recalls sent.
4. **Scans per batch, last 30 days**: the top 5 batches as progress bars, each linking to the batch.
5. **Certificates**: those expiring in the next 30 days or lapsed in the last 30 (not revoked ones), soonest first, e.g. "Expires in 19 days".
6. **Recent batches**: the 6 newest, with made date, total scans and status.

Tip totals are added here in Milestone 7.

## Main files

| File | What it does |
|---|---|
| `service.ts` | `greeting`, `certificatesNeedingAttention`, `daysLeftLabel`. Pure, unit tested |
| `server/queries.ts` | `getDashboard(owner, now)`: gathers analytics, recalls, certificates and batches through their own features |
| `components/DashboardCards.tsx` | The five cards |

Shared UI: `StatNumber`, `BarStrip` (a plain-HTML bar chart with a screen-reader table; no chart library, works without JavaScript), `ProgressRow`, and `Card tone="accent"` in `src/ui`.

## Connections

It reads from `analytics` (`scansByDay`, `topBatchesByScans`, `totalScans`), `recalls` (`recallTotals`), `certificates` (`listCertificates` and its validity rules) and `batches` (`listBatches`). It owns no tables.

## Known limitations

- Every story page view counts as a scan, including reloads; there is no deduplication.
- "This week" means the last 7 days, not Monday to Sunday.

## How to test

- Unit: `npx vitest run src/features/dashboard src/features/analytics`
- Database (days in the brand's zone): `npm run test:db`
- Browser: `npx playwright test tests/e2e/dashboard.spec.ts`
- By hand: `npm run db:seed`, then log in as the demo brewery (see the README).
