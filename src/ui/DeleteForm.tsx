"use client";
// A "Delete ..." button that asks for confirmation (when JavaScript is
// available) and shows the result, e.g. "still in use" errors.
import type { Result } from "@/lib/result";
import { FormStatus } from "./FormStatus";
import { SubmitButton } from "./SubmitButton";
import { useFormAction } from "./useFormAction";

type DeleteFormProps = {
  action: (previousState: unknown, form: FormData) => Promise<Result<unknown>>;
  /** Hidden fields identifying what to delete, e.g. { supplierId: "..." }. */
  fields: Record<string, string>;
  label: string;
  confirmMessage: string;
};

export function DeleteForm({ action, fields, label, confirmMessage }: DeleteFormProps) {
  const { result, pending, formProps } = useFormAction(action, { confirmMessage });

  return (
    <form {...formProps} className="flex flex-wrap items-center gap-3">
      {Object.entries(fields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <SubmitButton variant="danger" pending={pending} pendingLabel="Deleting…">
        {label}
      </SubmitButton>
      <FormStatus result={result} />
    </form>
  );
}
