"use client";
// Sign-up step two: brand and account details. After submitting, it shows
// "check your email" (Supabase sends the confirmation link).
import Link from "next/link";
import { fieldError } from "@/lib/result";
import { Card, Field, FormStatus, Input, SubmitButton } from "@/ui";
import { useFormAction } from "@/ui/useFormAction";
import { signUp } from "../server/actions";

type SignUpFormProps = { industry: string; industryName: string; placeLabel: string };

export function SignUpForm({ industry, industryName, placeLabel }: SignUpFormProps) {
  const { result, pending: formActionPending, formProps: formActionProps } = useFormAction(signUp);
  const error = (field: string) => fieldError(result, field);

  if (result?.ok) {
    return (
      <Card>
        <h2 className="mb-3 text-2xl">Check your email</h2>
        <p className="text-muted">
          We sent a confirmation link to <strong className="text-ink">{result.data.email}</strong>. Open it on this
          device to finish setting up your account.
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <form {...formActionProps} className="flex flex-col gap-5">
        <input type="hidden" name="industry" value={industry} />
        <p className="text-sm text-muted">
          Setting up a {industryName.toLowerCase()} account. <Link href="/signup">Change</Link>
        </p>
        <Field id="brandName" label={`${placeLabel} name`} error={error("brandName")}>
          <Input id="brandName" name="brandName" maxLength={80} required autoComplete="organization" invalid={!!error("brandName")} />
        </Field>
        <Field id="location" label="Location" hint="Town and province, e.g. Port Moody, BC" error={error("location")}>
          <Input id="location" name="location" maxLength={120} required autoComplete="address-level2" invalid={!!error("location")} />
        </Field>
        <Field id="email" label="Email" error={error("email")}>
          <Input id="email" name="email" type="email" required autoComplete="email" invalid={!!error("email")} />
        </Field>
        <Field id="password" label="Password" hint="At least 8 characters." error={error("password")}>
          <Input id="password" name="password" type="password" minLength={8} maxLength={72} required autoComplete="new-password" invalid={!!error("password")} />
        </Field>
        <SubmitButton pending={formActionPending} fullWidth pendingLabel="Creating your account…">
          Create account
        </SubmitButton>
        <FormStatus result={result} />
      </form>
    </Card>
  );
}
