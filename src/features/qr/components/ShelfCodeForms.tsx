"use client";
// Forms for shelf codes: create one, and point one at a different batch.
import { fieldError } from "@/lib/result";
import { Card, Field, FormStatus, Input, Select, SubmitButton, type SelectOption } from "@/ui";
import { useFormAction } from "@/ui/useFormAction";
import { createShelfCode, pointShelfCode } from "../server/actions";

export function CreateShelfCodeForm({ batchOptions }: { batchOptions: SelectOption[] }) {
  const { result, pending, formProps } = useFormAction(createShelfCode, { resetOnSuccess: true });
  return (
    <Card>
      <h2 className="mb-4 text-xl">New shelf code</h2>
      <form {...formProps} className="flex flex-col gap-4">
        <Field id="label" label="Where it goes" hint="e.g. Tap 3, Fridge door, Market stall" error={fieldError(result, "label")}>
          <Input id="label" name="label" maxLength={60} required invalid={!!fieldError(result, "label")} />
        </Field>
        <Field id="new-batchId" label="Points to (optional)">
          <Select id="new-batchId" name="batchId" options={batchOptions} placeholder="No batch yet" />
        </Field>
        <div className="flex flex-wrap items-center gap-3">
          <SubmitButton pending={pending}>Create shelf code</SubmitButton>
          <FormStatus result={result} />
        </div>
      </form>
    </Card>
  );
}

type PointFormProps = { shelfCodeId: string; currentBatchId: string | null; batchOptions: SelectOption[] };

export function PointShelfCodeForm({ shelfCodeId, currentBatchId, batchOptions }: PointFormProps) {
  const { result, pending, formProps } = useFormAction(pointShelfCode);
  const id = `point-${shelfCodeId}`;
  return (
    <form {...formProps} className="flex flex-col gap-3">
      <input type="hidden" name="shelfCodeId" value={shelfCodeId} />
      <Field id={id} label="Points to">
        <Select id={id} name="batchId" options={batchOptions} placeholder="No batch" defaultValue={currentBatchId ?? ""} />
      </Field>
      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton variant="secondary" pending={pending}>
          Repoint
        </SubmitButton>
        <FormStatus result={result} />
      </div>
    </form>
  );
}
