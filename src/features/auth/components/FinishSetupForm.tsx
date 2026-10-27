"use client";
// "Finish setting up": for a logged-in account that has no brand yet. Asks
// what they make and the brand's name and location, then opens the dashboard.
import { IndustryChoice } from "@/features/industries";
import { fieldError } from "@/lib/result";
import { Field, FormStatus, Input, SubmitButton } from "@/ui";
import { useFormAction } from "@/ui/useFormAction";
import { finishSetup } from "../server/actions";

export function FinishSetupForm() {
  const { result, pending, formProps } = useFormAction(finishSetup);
  const error = (field: string) => fieldError(result, field);

  return (
    <form {...formProps} className="flex flex-col gap-6">
      <IndustryChoice invalid={!!error("industry")} />
      {error("industry") && <p className="text-sm text-danger">Choose what you make</p>}
      <Field id="brandName" label="Business name" error={error("brandName")}>
        <Input id="brandName" name="brandName" maxLength={80} required autoComplete="organization" invalid={!!error("brandName")} />
      </Field>
      <Field id="location" label="Location" hint="Town and province, e.g. Port Moody, BC" error={error("location")}>
        <Input id="location" name="location" maxLength={120} required autoComplete="address-level2" invalid={!!error("location")} />
      </Field>
      <SubmitButton pending={pending} pendingLabel="Setting up…" fullWidth>
        Continue to my dashboard
      </SubmitButton>
      <FormStatus result={result} />
    </form>
  );
}
