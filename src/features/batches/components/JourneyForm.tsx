"use client";
// The batch's journey: ordered stops from the producer to the store. Stops are
// copied from the previous batch (dates cleared); a product's first batch starts
// with one stop, the producer's own place. "Add another address" adds a stop at
// the bottom and "Remove" takes one out. A stop left completely empty is ignored.
import { useState } from "react";
import { formatCoordinates } from "@/lib/coordinates";
import { Button, Card, Field, FormStatus, Input, Select, SubmitButton, type SelectOption } from "@/ui";
import { MapPositionField } from "@/ui/MapPositionField";
import { useFormAction } from "@/ui/useFormAction";
import { saveStops } from "../server/contents-actions";
import type { StopDraft } from "../service";

type Row = StopDraft & { key: number };

const blankStop = (type?: SelectOption): StopDraft => ({ name: type?.label ?? "", type: type?.value ?? "", address: "", latitude: null, longitude: null, arrivedOn: null, note: null });

/**
 * A new stop: the template type after the last stop's, so a journey reads farm → … → store by
 * default, named after that type (e.g. "Cold storage") until the producer renames it.
 */
function nextStop(rows: Row[], stopTypes: SelectOption[]): StopDraft {
  const last = rows.at(-1)?.type;
  const index = stopTypes.findIndex((option) => option.value === last);
  return blankStop(stopTypes[Math.min(index + 1, stopTypes.length - 1)] ?? stopTypes[0]);
}

export function JourneyForm({ batchId, stops, stopTypes }: { batchId: string; stops: StopDraft[]; stopTypes: SelectOption[] }) {
  const { result, pending, formProps } = useFormAction(saveStops);
  const [rows, setRows] = useState<Row[]>(() => {
    const start = stops.length > 0 ? stops : [blankStop(stopTypes[0])];
    return start.map((stop, key) => ({ ...stop, key }));
  });
  const [nextKey, setNextKey] = useState(rows.length);
  const rowErrors = result && !result.ok ? Object.values(result.error.fieldErrors ?? {}).flat() : [];

  const addRow = () => {
    setRows((current) => [...current, { ...nextStop(current, stopTypes), key: nextKey }]);
    setNextKey((key) => key + 1);
  };
  const removeRow = (key: number) => setRows((current) => current.filter((row) => row.key !== key));

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
          {rows.map((stop, index) => (
            <StopRow
              key={stop.key}
              stop={stop}
              index={index}
              stopTypes={stopTypes}
              onRemove={rows.length > 1 ? () => removeRow(stop.key) : undefined}
            />
          ))}
        </ol>
        <Button variant="secondary" onClick={addRow} className="self-start">
          + Add another address
        </Button>
        <p className="text-sm text-muted">Stops are shown to shoppers in this order, after the supplier lots.</p>
        <div className="flex flex-wrap items-center gap-3">
          <SubmitButton pending={pending}>Save journey</SubmitButton>
          <FormStatus result={result} />
        </div>
      </form>
    </Card>
  );
}

function StopRow({ stop, index, stopTypes, onRemove }: { stop: StopDraft; index: number; stopTypes: SelectOption[]; onRemove?: () => void }) {
  const id = (field: string) => `stop-${index}-${field}`;
  const coordinates = stop.latitude !== null && stop.longitude !== null ? formatCoordinates({ latitude: stop.latitude, longitude: stop.longitude }) : "";
  return (
    <li className="grid gap-3 rounded border border-line p-3 sm:grid-cols-2">
      <div className="flex items-center justify-between gap-3 sm:col-span-2">
        <p className="text-sm font-medium">Stop {index + 1}</p>
        {onRemove && (
          <button type="button" onClick={onRemove} className="min-h-9 rounded px-2 text-sm text-danger hover:bg-danger/5" aria-label={`Remove stop ${index + 1}`}>
            Remove
          </button>
        )}
      </div>
      <Field id={id("name")} label="Name">
        <Input id={id("name")} name="name[]" defaultValue={stop.name} maxLength={100} placeholder="e.g. Coquitlam cold storage" />
      </Field>
      <Field id={id("type")} label="Type">
        <Select id={id("type")} name="type[]" options={stopTypes} defaultValue={stop.type || stopTypes[0]?.value} />
      </Field>
      <Field id={id("address")} label="Address">
        <Input id={id("address")} name="address[]" defaultValue={stop.address} maxLength={200} />
      </Field>
      <MapPositionField id={id("coordinates")} name="coordinates[]" addressInputId={id("address")} defaultValue={coordinates} />
      <Field id={id("arrivedOn")} label="Date (optional)">
        <Input id={id("arrivedOn")} name="arrivedOn[]" type="date" defaultValue={stop.arrivedOn ?? ""} />
      </Field>
      <Field id={id("note")} label="Note (optional)" hint="e.g. Kept at 3°C">
        <Input id={id("note")} name="note[]" defaultValue={stop.note ?? ""} maxLength={200} />
      </Field>
    </li>
  );
}
