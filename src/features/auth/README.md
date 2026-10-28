# Auth feature

Producer accounts: email and password sign-up, email confirmation, login and logout, forgot password, changing the password and deleting the account. There is one owner per brand. Supabase Auth stores accounts and passwords; Rootline never sees or stores a password.

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

### Forgot password
1. **`/forgot-password`** (`ForgotPasswordForm` → `requestPasswordReset`). Supabase emails a link back to `/auth/confirm?next=/reset-password`. The answer is the same whether or not the address has an account, and one visitor can ask 5 times in 15 minutes.
2. **The link → `/auth/confirm`** logs the owner in and sets a signed, http-only **recovery cookie** for 30 minutes (`server/recovery.ts`, signed with HMAC in `service.ts`). An expired or used link goes to `/forgot-password?error=expired`.
3. **`/reset-password`** (`SetNewPasswordForm` → `setNewPassword`) works only with that cookie. Without it, someone at an unlocked, logged-in computer could change the password without access to the email. Saving clears the cookie and goes to `/account`.

### Account page (`/account`, "Account" in the sidebar)
- **Change password** (`changePassword`): asks for the current password first.
- **Delete account** (`deleteAccount`, `server/account.ts`): needs the password and the word DELETE. In order: cancels any Stripe subscription at once (if Stripe can't be reached, nothing is removed); deletes the brand, which removes all its rows (ON DELETE CASCADE); removes its files from all three storage buckets; deletes the Supabase login; logs out and shows `/login?notice=deleted`. Stripe keeps the customer and past invoices, which are needed for tax records. If file or login removal fails after the data is gone, it is logged as an error to finish by hand.
- Passwords are re-checked by `server/verify-password.ts` with a separate Supabase client, so the browser's session is untouched. It is not a server action, so it can't be called from a browser.

## Main files

| File | What it does |
|---|---|
| `schema.ts` | Zod schemas for the sign-up and login forms |
| `service.ts` | `authErrorCode` (Supabase error → our code), `isRepeatSignUp`, `safeNextPath` |
| `server/actions.ts` | `signUp`, `logIn`, `logOut` server actions |
| `server/confirm.ts` | Confirmation and reset link handling |
| `server/password.ts` | `requestPasswordReset`, `setNewPassword`, `changePassword` |
| `server/account.ts` | `deleteAccount` |
| `server/recovery.ts`, `server/verify-password.ts` | The recovery cookie; re-checking a password |
| `components/` | Industry step, sign-up form, login form, producer header, log-out button |

Shared helpers it relies on: `src/lib/supabase.ts` (Supabase clients), `src/lib/auth.ts` (`requireOwner`, `getOwner`), `src/lib/supabase-proxy.ts` (refreshes sessions on each request).

## Data

There are no tables of its own. Supabase's `auth.users` holds accounts. `Brand.ownerUserId` links a brand to its owner and is unique, so there is one owner per brand.

## Error codes

`AUTH_INVALID_CREDENTIALS`, `AUTH_EMAIL_NOT_CONFIRMED`, `AUTH_EMAIL_TAKEN`, `AUTH_RATE_LIMITED`, `AUTH_CONFIRM_FAILED`, `AUTH_RESET_EXPIRED`, `AUTH_SAME_PASSWORD`, `ACCOUNT_DELETE_FAILED`.

## Known limitations

- **Emails from Supabase** (sign-up confirmation, password reset) go through Supabase's built-in sender until custom SMTP is set up: only a few per hour, and only to the project's team members. See "Sending real email" in the main README.
- Confirmation and reset links must be opened in the same browser unless the Supabase email templates are changed to the `token_hash` form (see the README).
- The reset-request limit is kept in memory, per server instance; Supabase's own limit is the hard one.

## How to test

- Unit: `npx vitest run src/features/auth`
- Browser: `npx playwright test tests/e2e/producer-brand.spec.ts tests/e2e/account.spec.ts`. They create pre-confirmed users through the Supabase admin API, and reset links with `generateLink`, so no email is sent.
