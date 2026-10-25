"use client";
// The brand's photo gallery: add photos (up to the limit) and remove them.
// The first photo is used as the story page hero when a batch has none.
import { ACCEPTED_IMAGE_TYPES } from "@/lib/storage-rules";
import { Card, Field, FormStatus, Input, Photo, SubmitButton } from "@/ui";
import { useFormAction } from "@/ui/useFormAction";
import { addBrandPhoto, removeBrandPhoto } from "../server/profile-actions";
import { MAX_BRAND_PHOTOS, canAddPhoto } from "../service";

type PhotoItem = { path: string; url: string };

export function PhotoGallery({ photos, brandName }: { photos: PhotoItem[]; brandName: string }) {
  const { result: addResult, pending: addActionPending, formProps: addActionProps } = useFormAction(addBrandPhoto, { resetOnSuccess: true });

  return (
    <Card>
      <h2 className="mb-1 text-xl">Photos</h2>
      <p className="mb-5 text-sm text-muted">
        Real photos of your place and work, up to {MAX_BRAND_PHOTOS}. The first one leads your story page.
      </p>

      {photos.length > 0 && (
        <ul className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {photos.map((photo, index) => (
            <li key={photo.path} className="flex flex-col gap-2">
              <Photo src={photo.url} alt={`${brandName} photo ${index + 1}`} aspect="landscape" sizes="(min-width: 640px) 30vw, 45vw" />
              <RemovePhotoButton path={photo.path} />
            </li>
          ))}
        </ul>
      )}

      {canAddPhoto(photos.length) ? (
        <form {...addActionProps} className="flex flex-col gap-3">
          <Field id="photo-file" label="Add a photo" hint="JPG, PNG or WebP, under 4 MB.">
            <Input id="photo-file" name="file" type="file" accept={ACCEPTED_IMAGE_TYPES} required />
          </Field>
          <div className="flex flex-wrap items-center gap-3">
            <SubmitButton pending={addActionPending} pendingLabel="Uploading…">Add photo</SubmitButton>
            <FormStatus result={addResult} />
          </div>
        </form>
      ) : (
        <p className="text-sm text-muted">You have {MAX_BRAND_PHOTOS} photos. Remove one to add another.</p>
      )}
    </Card>
  );
}

function RemovePhotoButton({ path }: { path: string }) {
  const { result, pending: actionPending, formProps: actionProps } = useFormAction(removeBrandPhoto);
  return (
    <form {...actionProps} className="flex flex-col gap-1">
      <input type="hidden" name="path" value={path} />
      <SubmitButton pending={actionPending} variant="ghost" pendingLabel="Removing…" className="self-start px-2">
        Remove
      </SubmitButton>
      {result && !result.ok && <FormStatus result={result} />}
    </form>
  );
}
