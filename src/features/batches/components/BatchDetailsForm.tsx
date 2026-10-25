"use client";
// Step 1 of "New batch" (product and dates), also used to edit those details.
// Date labels and extra fields come from the industry template.
import { useState } from "react";
import { ExtraFieldInputs, type IndustryTemplate } from "@/features/industries";
import { fieldError } from "@/lib/result";
import { Card, Field, FormStatus, Input, Select, SubmitButton, type SelectOption } from "@/ui";
import { useFormAction } from "@/ui/useFormAction";
import { createBatch, updateBatchDetails } from "../server/actions";

export type BatchDetailsValues = {
  batchId?: string;
  productId: string;
  number: number;
  madeOn: string;
  madeTime: string;
  packagedOn: string;
  extra: Record<string, unknown>;
};

type BatchDetailsFormProps = {
  template: Pick<IndustryTemplate, "labels" | "dates" | "batchFields">;
  values: BatchDetailsValues;
  /** Create mode only: the products to choose from and each one's next number. */
  products?: SelectOption[];
  suggestedNumbers?: Record<string, number>;
};

export function BatchDetailsForm({ template, values, products, suggestedNumbers = {} }: BatchDetailsFormProps) {
  const editing = Boolean(values.batchId);
  const { result, pending, formProps } = useFormAction(editing ? updateBatchDetails : createBatch);
  const [productId, setProductId] = useState(values.productId);
  const error = (field: string) => fieldError(result, field);
  const fieldErrors = result && !result.ok ? result.error.fieldErrors : undefined;
  const number = editing ? values.number : (suggestedNumbers[productId] ?? values.number);

  return (
    <Card>
      <form {...formProps} className="flex flex-col gap-5">
        {editing && <input type="hidden" name="batchId" value={values.batchId} />}
        {!editing && (
          <Field id="productId" label={template.labels.product} error={error("productId")}>
            <Select
              id="productId"
              name="productId"
              options={products ?? []}
              defaultValue={values.productId}
              onChange={(event) => setProductId(event.target.value)}
              required
              invalid={!!error("productId")}
            />
          </Field>
        )}
        <Field id="number" label={`${template.labels.batch} number`} hint="Pre-filled with the next number for this product." error={error("number")}>
          {/* key: show the new suggestion when another product is chosen */}
          <Input key={productId} id="number" name="number" inputMode="numeric" defaultValue={number} required invalid={!!error("number")} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="madeOn" label={`${template.dates.made.label} on`} error={error("madeOn")}>
            <Input id="madeOn" name="madeOn" type="date" defaultValue={values.madeOn} required invalid={!!error("madeOn")} />
          </Field>
          {template.dates.made.includesTime && (
            <Field id="madeTime" label="At" error={error("madeTime")}>
              <Input id="madeTime" name="madeTime" type="time" defaultValue={values.madeTime} required invalid={!!error("madeTime")} />
            </Field>
          )}
          {template.dates.packaged && (
            <Field id="packagedOn" label={`${template.dates.packaged.label} on`} hint="Can be added later." error={error("packagedOn")}>
              <Input id="packagedOn" name="packagedOn" type="date" defaultValue={values.packagedOn} invalid={!!error("packagedOn")} />
            </Field>
          )}
        </div>
        <ExtraFieldInputs fields={template.batchFields} values={values.extra} errors={fieldErrors} />
        <div className="flex flex-wrap items-center gap-4">
          <SubmitButton pending={pending} fullWidth={!editing}>
            {editing ? "Save details" : "Next: lots"}
          </SubmitButton>
          <FormStatus result={result} />
        </div>
      </form>
    </Card>
  );
}
