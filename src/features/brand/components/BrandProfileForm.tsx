"use client";
// The brand details form: name, location, colours, quote and video link.
import { fieldError } from "@/lib/result";
import { formatCoordinates } from "@/lib/coordinates";
import { Card, Field, FormStatus, Input, SubmitButton, Textarea } from "@/ui";
import { MapPositionField } from "@/ui/MapPositionField";
import { useFormAction } from "@/ui/useFormAction";
import { saveBrandProfile } from "../server/profile-actions";
import type { BrandProfileView } from "../server/queries";

export function BrandProfileForm({ profile }: { profile: BrandProfileView }) {
  const { result, pending: formActionPending, formProps: formActionProps } = useFormAction(saveBrandProfile);
  const error = (field: string) => fieldError(result, field);

  return (
    <Card>
      <h2 className="mb-1 text-xl">Details</h2>
      <p className="mb-6 text-sm text-muted">Shown at the top of every story page.</p>
      <form {...formActionProps} className="flex flex-col gap-5">
        <Field id="name" label="Brand name" error={error("name")}>
          <Input id="name" name="name" defaultValue={profile.name} maxLength={80} required invalid={!!error("name")} />
        </Field>
        <Field id="location" label="Location" hint="Town and province, e.g. Port Moody, BC" error={error("location")}>
          <Input id="location" name="location" defaultValue={profile.location} maxLength={120} required invalid={!!error("location")} />
        </Field>

        <MapPositionField
          id="coordinates"
          name="coordinates"
          addressInputId="location"
          label="Map position (optional)"
          defaultValue={profile.latitude !== null && profile.longitude !== null ? formatCoordinates({ latitude: profile.latitude, longitude: profile.longitude }) : ""}
          error={error("coordinates")}
        />

        <fieldset className="grid grid-cols-2 gap-4">
          <legend className="mb-2 text-sm font-medium">Brand colours</legend>
          <ColourField id="colorPrimary" label="Main colour" value={profile.colorPrimary} />
          <ColourField id="colorAccent" label="Accent colour" value={profile.colorAccent} />
        </fieldset>

        <Field id="quote" label="Quote (optional)" hint="A line from you, up to 280 characters." error={error("quote")}>
          <Textarea id="quote" name="quote" defaultValue={profile.quote ?? ""} maxLength={280} rows={3} invalid={!!error("quote")} />
        </Field>
        <Field id="videoUrl" label="Video link (optional)" hint="A YouTube or Vimeo link." error={error("videoUrl")}>
          <Input id="videoUrl" name="videoUrl" type="url" defaultValue={profile.videoUrl ?? ""} placeholder="https://www.youtube.com/watch?v=…" invalid={!!error("videoUrl")} />
        </Field>

        <div className="flex flex-wrap items-center gap-4">
          <SubmitButton pending={formActionPending}>Save details</SubmitButton>
          <FormStatus result={result} />
        </div>
      </form>
    </Card>
  );
}

function ColourField({ id, label, value }: { id: string; label: string; value: string }) {
  return (
    <label htmlFor={id} className="flex items-center gap-3 text-sm">
      <input id={id} name={id} type="color" defaultValue={value} className="h-11 w-14 cursor-pointer rounded border border-line bg-card p-1" />
      {label}
    </label>
  );
}
