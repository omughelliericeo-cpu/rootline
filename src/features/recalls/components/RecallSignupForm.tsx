"use client";
// Story page: "Alert me if this batch is recalled". Email plus a consent box
// with the exact wording stored with the sign-up. Works without JavaScript.
import { fieldError } from "@/lib/result";
import { Field, FormStatus, Input, SubmitButton } from "@/ui";
import { useFormAction } from "@/ui/useFormAction";
import { subscribeToRecalls } from "../server/subscribe-actions";
import { RECALL_CONSENT_TEXT } from "../service";

export function RecallSignupForm({ batchCode }: { batchCode: string }) {
  const { result, pending, formProps } = useFormAction(subscribeToRecalls);

  if (result?.ok) {
    return (
      <p role="status" className="rounded border border-forest bg-card px-4 py-3 text-sm text-forest">
        {(result.data as { message: string }).message}
      </p>
    );
  }

  return (
    <form {...formProps} className="flex flex-col gap-3">
      <input type="hidden" name="batchCode" value={batchCode} />
      <Field id="recall-email" label="Email for recall alerts" error={fieldError(result, "email")}>
        <Input id="recall-email" name="email" type="email" autoComplete="email" required invalid={!!fieldError(result, "email")} />
      </Field>
      <label className="flex min-h-11 items-start gap-3 text-sm">
        <input type="checkbox" name="consent" required className="mt-1 h-5 w-5 shrink-0 accent-forest" />
        <span>{RECALL_CONSENT_TEXT}</span>
      </label>
      {fieldError(result, "consent") && <p className="text-sm text-danger">{fieldError(result, "consent")}</p>}
      <SubmitButton pending={pending} pendingLabel="Signing you up…" fullWidth>
        Alert me if this batch is recalled
      </SubmitButton>
      <FormStatus result={result} />
    </form>
  );
}
