"use client";
// "Forgot your password?": asks for the email and sends a reset link. The answer is
// the same whether or not the address has an account.
import Link from "next/link";
import { fieldError } from "@/lib/result";
import { Card, Field, FormStatus, Input, SubmitButton } from "@/ui";
import { useFormAction } from "@/ui/useFormAction";
import { requestPasswordReset } from "../server/password";

export function ForgotPasswordForm() {
  const { result, pending, formProps } = useFormAction(requestPasswordReset);
  const error = (field: string) => fieldError(result, field);

  if (result?.ok) {
    return (
      <Card>
        <h2 className="mb-3 text-2xl">Check your email</h2>
        <p className="text-muted">
          If <strong className="text-ink">{result.data.email}</strong> has a Rootline account, we&apos;ve sent it a link to choose a new
          password. Open it on this device within an hour. Nothing there? Check your spam folder.
        </p>
        <p className="mt-4 text-sm">
          <Link href="/login">Back to log in</Link>
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <form {...formProps} className="flex flex-col gap-5">
        <Field id="email" label="Email" error={error("email")}>
          <Input id="email" name="email" type="email" required autoComplete="email" invalid={!!error("email")} />
        </Field>
        <SubmitButton pending={pending} fullWidth pendingLabel="Sending…">
          Send reset link
        </SubmitButton>
        <FormStatus result={result} />
        <p className="text-center text-sm">
          <Link href="/login">Back to log in</Link>
        </p>
      </form>
    </Card>
  );
}
