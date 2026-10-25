"use client";
// The batch's journey: ordered stops from the producer to the store. Stops
// are copied from the previous batch (dates cleared) or start from the
// template's default stop types. Spare rows let stops be added without JavaScript.
import { formatCoordinates } from "@/lib/coordinates";
import { Card, Field, FormStatus, Input, Select, SubmitButton, type SelectOption } from "@/ui";
import { MapPositionField } from "@/ui/MapPositionField";
import { useFormAction } from "@/ui/useFormAction";
import { saveStops } from "../server/contents-actions";
import type { StopDraft } from "../service";

const SPARE_ROWS = 2;

const blankStop: StopDraft = { name: "", type: "", address: "", latitude: null, longitude: null, arrivedOn: null, note: null };

export function JourneyForm({ batchId, stops, stopTypes }: { batchId: string; stops: StopDraft[]; stopTypes: SelectOption[] }) {
  const { result, pending, formProps } = useFormAction(saveStops);
  const rows = [...stops, ...Array.from({ length: SPARE_ROWS }, () => blankStop)];
  const rowErrors = result && !result.ok ? Object.values(result.error.fieldErrors ?? {}).flat() : [];

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
          {rows.map((stop, index) => {
            const id = (field: string) => `stop-${index}-${field}`;
            const coordinates = stop.latitude !== null && stop.longitude !== null ? formatCoordinates({ latitude: stop.latitude, longitude: stop.longitude }) : "";
            return (
              <li key={index} className="grid gap-3 rounded border border-line p-3 sm:grid-cols-2">
                <p className="text-sm font-medium sm:col-span-2">Stop {index + 1}</p>
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
          })}
        </ol>
        <p className="text-sm text-muted">Stops are shown in this order. To remove a stop, empty all of its boxes.</p>
        <div className="flex flex-wrap items-center gap-3">
          <SubmitButton pending={pending}>Save journey</SubmitButton>
          <FormStatus result={result} />
        </div>
      </form>
    </Card>
  );
}
