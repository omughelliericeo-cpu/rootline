# Recalls feature

Recall alerts:
- Shoppers leave their email on a batch's story page, agreeing to clear wording.
- If the producer recalls that batch, everyone signed up gets an email, and the story page shows a warning at the top for every visitor.
- Every email has an unsubscribe link.

## Flow

1. **Sign up** (story page, `RecallSignupForm` → `subscribeToRecalls`): email and a consent box. The exact wording (`RECALL_CONSENT_TEXT`) and the time are stored with the sign-up. Signing up twice for the same batch is ignored, and says nothing about whether the email was already there.
2. **Send a recall** (`/batches/{id}/recall`, `SendRecallForm` → `sendRecall`):
   - The producer writes what is wrong and what to do, ticks the confirmation box, and confirms again.
   - The message is saved first, so it shows on the story page straight away.
   - It is then emailed to every subscriber who has not unsubscribed, one email each (no shared To or BCC).
   - The saved message records how many emails were sent and how many failed.
3. **Warning on the story page** (`RecallNotice`): every recall for the batch is shown above everything else, so shoppers see it whether or not they signed up.
4. **Unsubscribe:**
   - The email's link opens `/recall/unsubscribe/{token}`, with one button. Opening the link alone changes nothing, because email security scanners open links automatically.
   - Mail apps' own Unsubscribe button posts to `/api/recall/unsubscribe/{token}` (the RFC 8058 one-click standard, via the `List-Unsubscribe` headers). That endpoint is POST only.

## Main files

| File | What it does |
|---|---|
| `service.ts` | Consent wording, unsubscribe tokens (192-bit random hex), building the email (escaped HTML and plain text, unsubscribe headers) |
| `schema.ts` | Zod schemas for sign-up, sending and unsubscribing |
| `server/subscribe-actions.ts` | `subscribeToRecalls`, `unsubscribe` (public actions, no login) |
| `server/unsubscribe.ts` | `unsubscribeByToken`: calls the `recall_unsubscribe` database function |
| `server/send-actions.ts` | `sendRecall` (producer) |
| `server/queries.ts` | `recallSummary`: subscriber count and sent recalls. Never returns email addresses |
| `components/` | Sign-up form, recall notice, send form, history, unsubscribe button |
| `src/lib/email.ts` (shared) | Sending through Resend in batches of 100 with idempotency keys, or log-only mode |

## Data and security

- **`recall_subscriber`**: batch, email (lower-case, unique per batch), consent text and time, unsubscribe token, unsubscribed at.
- **`recall_message`**: batch, subject, body, sent at, recipient count, failed count.
- **Row-level security:**
  - The public may **add** a subscriber to a published batch. The insert does not read the row back, and the public can never read subscribers.
  - The brand reads its own.
  - Recall messages are publicly readable only for published batches (they are the story page warning).
- **Unsubscribing** uses the `recall_unsubscribe(token)` database function (`SECURITY DEFINER`). It can only mark the one subscriber holding that secret token.
- `src/lib/tests/public-read.db.test.ts` proves all of the above.

## Email setup

- `EMAIL_PROVIDER=resend` (the default) needs `RESEND_API_KEY`. `EMAIL_FROM` must be an address on a domain verified in Resend. Without a domain, Resend's test sender only delivers to your own Resend account email.
- Without a key, sending is refused with `EMAIL_NOT_CONFIGURED`, and nothing is saved.
- `EMAIL_PROVIDER=log` writes emails to the logs instead (addresses masked). The browser tests use this, and you can use it to try the feature without a Resend account.
- Every Resend call carries an idempotency key built from the recall's id, so a retry can never email anyone twice.

## Known limitations

- No rate limit on sign-ups beyond the consent box. Add one if spam appears.
- A recall cannot be edited or withdrawn from the story page after sending. A follow-up recall message can be sent.
- There is no "export subscriber list". Producers see counts only.

## How to test

- Unit: `npx vitest run src/features/recalls src/lib/tests/email.test.ts`
- Security: `npm run test:db`
- Browser: `npx playwright test tests/e2e/recalls.spec.ts`
