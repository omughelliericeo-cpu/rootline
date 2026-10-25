# Auth feature

Producer accounts: email and password sign-up, email confirmation, login and logout. There is one owner per brand. Supabase Auth stores accounts and passwords; Rootline never sees or stores a password.

## Flow

1. **`/signup`, step 1: "What do you make?"** A plain GET form (`components/IndustryStep.tsx`). The choice goes into the URL (`/signup?industry=brewery`).
2. **Step 2: brand and account details** (`components/SignUpForm.tsx` → `server/actions.ts` `signUp`).
   - Supabase creates the user and emails a confirmation link.
   - The brand row is created straight away with the chosen industry (`createBrandForOwner` from the brand feature). If that fails, the Supabase user is deleted again so they can retry.
   - Signing up again before confirming re-sends the email and does **not** create a second brand.
   - Signing up with an already-confirmed email returns `AUTH_EMAIL_TAKEN`.
3. **Confirmation link → `/auth/confirm`** (`server/confirm.ts`). It accepts `?code=` (Supabase's default email) or `?token_hash=&type=` (recommended template; also works on another device). On success it goes to `/dashboard`; on failure, `/login?error=confirm`.
4. **`/login`** (`components/LogInForm.tsx` → `logIn`). The `?next=` path is respected only when it is on this site (`safeNextPath`).
5. **Log out**: the button in the producer header (`logOut`).

## Main files

| File | What it does |
|---|---|
| `schema.ts` | Zod schemas for the sign-up and login forms |
| `service.ts` | `authErrorCode` (Supabase error → our code), `isRepeatSignUp`, `safeNextPath` |
| `server/actions.ts` | `signUp`, `logIn`, `logOut` server actions |
| `server/confirm.ts` | Confirmation link handling |
| `components/` | Industry step, sign-up form, login form, producer header, log-out button |

Shared helpers it relies on: `src/lib/supabase.ts` (Supabase clients), `src/lib/auth.ts` (`requireOwner`, `getOwner`), `src/lib/supabase-proxy.ts` (refreshes sessions on each request).

## Data

There are no tables of its own. Supabase's `auth.users` holds accounts. `Brand.ownerUserId` links a brand to its owner and is unique, so there is one owner per brand.

## Error codes

`AUTH_INVALID_CREDENTIALS`, `AUTH_EMAIL_NOT_CONFIRMED`, `AUTH_EMAIL_TAKEN`, `AUTH_RATE_LIMITED`, `AUTH_CONFIRM_FAILED`.

## Known limitations

- **No "forgot password" screen yet.** It is not in the MVP list. An owner can be sent a reset email from the Supabase dashboard (Authentication → Users).
- Supabase's built-in email sender allows only a few emails per hour. Set up custom SMTP (e.g. Resend) in Supabase before pilots.
- The confirmation link must be opened in the same browser unless the Supabase email template is changed (see the README).

## How to test

- Unit: `npx vitest run src/features/auth`
- Browser: `npx playwright test tests/e2e/producer-brand.spec.ts`. It creates a pre-confirmed user through the Supabase admin API, so no email is sent.
