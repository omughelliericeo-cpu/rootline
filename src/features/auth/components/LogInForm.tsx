"use client";
// Email and password login for producers.
import Link from "next/link";
import { fieldError } from "@/lib/result";
import { Card, Field, FormStatus, Input, SubmitButton } from "@/ui";
import { useFormAction } from "@/ui/useFormAction";
import { logIn } from "../server/actions";

export function LogInForm({ next }: { next?: string }) {
  const { result, pending: formActionPending, formProps: formActionProps } = useFormAction(logIn);
  const error = (field: string) => fieldError(result, field);

  return (
    <Card>
      <form {...formActionProps} className="flex flex-col gap-5">
        {next && <input type="hidden" name="next" value={next} />}
        <Field id="email" label="Email" error={error("email")}>
          <Input id="email" name="email" type="email" required autoComplete="email" invalid={!!error("email")} />
        </Field>
        <Field id="password" label="Password" error={error("password")}>
          <Input id="password" name="password" type="password" required autoComplete="current-password" invalid={!!error("password")} />
        </Field>
        <p className="-mt-3 text-right text-sm">
          <Link href="/forgot-password">Forgot your password?</Link>
        </p>
        <SubmitButton pending={formActionPending} fullWidth pendingLabel="Logging in…">
          Log in
        </SubmitButton>
        <FormStatus result={result} />
      </form>
    </Card>
  );
}
