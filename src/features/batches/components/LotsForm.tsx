"use client";
// Step 2 of "New batch": the supplier lots that went into it, pre-filled
// from the previous batch of the same product. Spare rows at the bottom let
// more lots be added without JavaScript; blank rows are ignored.
import Link from "next/link";
import { Card, Field, FormStatus, Input, Select, SubmitButton, type SelectOption } from "@/ui";
import { useFormAction } from "@/ui/useFormAction";
import { saveLots } from "../server/contents-actions";
import type { LotDraft } from "../service";

const SPARE_ROWS = 2;

type LotsFormProps = { batchId: string; lots: LotDraft[]; suppliers: SelectOption[]; inFlow: boolean };

export function LotsForm({ batchId, lots, suppliers, inFlow }: LotsFormProps) {
  const { result, pending, formProps } = useFormAction(saveLots);
  const rows: LotDraft[] = [...lots, ...Array.from({ length: SPARE_ROWS }, () => ({ supplierId: "", ingredient: "", lotNumber: "" }))];
  const rowErrors = result && !result.ok ? Object.values(result.error.fieldErrors ?? {}).flat() : [];

  if (suppliers.length === 0) {
    return (
      <Card>
        <p className="mb-4 text-muted">Add the farms and suppliers you buy from first. Their lots start every journey.</p>
        <Link href="/suppliers/new">Add a supplier</Link>
      </Card>
    );
  }

  return (
    <Card>
      <form {...formProps} className="flex flex-col gap-5">
        <input type="hidden" name="batchId" value={batchId} />
        {rowErrors.length > 0 && (
          <ul role="alert" className="flex flex-col gap-1 text-sm text-danger">
            {rowErrors.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        )}
        <ol className="flex flex-col gap-4">
          {rows.map((lot, index) => (
            <li key={index} className="grid gap-3 rounded border border-line p-3 sm:grid-cols-3">
              <Field id={`lot-${index}-supplier`} label={`Supplier ${index + 1}`}>
                <Select id={`lot-${index}-supplier`} name="supplierId[]" options={suppliers} placeholder="Choose" defaultValue={lot.supplierId} />
              </Field>
              <Field id={`lot-${index}-ingredient`} label="What came from them">
                <Input id={`lot-${index}-ingredient`} name="ingredient[]" defaultValue={lot.ingredient} maxLength={120} placeholder="e.g. Pilsner malt" />
              </Field>
              <Field id={`lot-${index}-number`} label="Lot number">
                <Input id={`lot-${index}-number`} name="lotNumber[]" defaultValue={lot.lotNumber} maxLength={60} placeholder="e.g. KF-2026-118" />
              </Field>
            </li>
          ))}
        </ol>
        <div className="flex flex-wrap items-center gap-3">
          {inFlow ? (
            <>
              <SubmitButton pending={pending} name="then" value="print">
                Next: print
              </SubmitButton>
              <SubmitButton pending={pending} variant="secondary" name="then" value="stay">
                Save and add more
              </SubmitButton>
            </>
          ) : (
            <SubmitButton pending={pending} name="then" value="stay">
              Save lots
            </SubmitButton>
          )}
          <FormStatus result={result} />
        </div>
      </form>
    </Card>
  );
}
