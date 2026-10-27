"use client";
// Story page: "Share your photo". A photo, an optional note and first name,
// and a consent box. On phones the photo is shrunk before upload; the form
// also works without JavaScript (the server checks and cleans the photo).
import { fieldError } from "@/lib/result";
import { ACCEPTED_IMAGE_TYPES } from "@/lib/storage-rules";
import { Field, FormStatus, Input, SubmitButton, Textarea } from "@/ui";
import { shrinkImageField } from "@/ui/shrinkImage";
import { useFormAction } from "@/ui/useFormAction";
import { sharePhoto } from "../server/share-action";
import { FIRST_NAME_MAX, NOTE_MAX } from "../service";

type SharePhotoFormProps = { batchCode: string; brandName: string; consent: string };

export function SharePhotoForm({ batchCode, brandName, consent }: SharePhotoFormProps) {
  const { result, pending, formProps } = useFormAction(sharePhoto, { prepare: shrinkImageField("photo") });
  const error = (field: string) => fieldError(result, field);

  if (result?.ok) {
    return (
      <p role="status" className="rounded border border-forest bg-card px-4 py-3 text-sm text-forest">
        {(result.data as { message: string }).message}
      </p>
    );
  }

  return (
    <form {...formProps} encType="multipart/form-data" className="flex flex-col gap-4">
      <input type="hidden" name="batchCode" value={batchCode} />
      <Field id="share-photo" label="Your photo" hint="JPG, PNG or WebP. Take one now or pick one you have." error={error("photo")}>
        <Input id="share-photo" name="photo" type="file" accept={ACCEPTED_IMAGE_TYPES} required invalid={!!error("photo")} />
      </Field>
      <Field id="share-note" label="A few words (optional)" hint="For example: Perfect with fish tacos." error={error("note")}>
        <Textarea id="share-note" name="note" rows={2} maxLength={NOTE_MAX} invalid={!!error("note")} />
      </Field>
      <Field id="share-name" label="First name (optional)" hint="Shown with your photo. Leave it empty to stay anonymous." error={error("firstName")}>
        <Input id="share-name" name="firstName" autoComplete="given-name" maxLength={FIRST_NAME_MAX} invalid={!!error("firstName")} />
      </Field>
      {/* Trap for bots: hidden from people and screen readers. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="share-website">Leave this empty</label>
        <input id="share-website" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      <label className="flex min-h-11 items-start gap-3 text-sm">
        <input type="checkbox" name="consent" required className="mt-1 h-5 w-5 shrink-0 accent-forest" />
        <span>{consent}</span>
      </label>
      {error("consent") && <p className="text-sm text-danger">{error("consent")}</p>}
      <p className="text-xs text-muted">
        {brandName} looks at every photo before it appears. We remove hidden details such as where it was taken, and never ask
        for your email.
      </p>
      <SubmitButton pending={pending} pendingLabel="Sending your photo…" fullWidth variant="secondary">
        Share my photo
      </SubmitButton>
      <FormStatus result={result} />
    </form>
  );
}
