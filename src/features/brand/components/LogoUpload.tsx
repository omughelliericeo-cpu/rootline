"use client";
// Upload or remove the brand logo.
import Image from "next/image";
import { ACCEPTED_IMAGE_TYPES } from "@/lib/storage-rules";
import { Card, Field, FormStatus, Input, SubmitButton } from "@/ui";
import { useFormAction } from "@/ui/useFormAction";
import { removeBrandLogo, uploadBrandLogo } from "../server/profile-actions";

export function LogoUpload({ logoUrl, brandName }: { logoUrl: string | null; brandName: string }) {
  const { result: uploadResult, pending: uploadActionPending, formProps: uploadActionProps } = useFormAction(uploadBrandLogo, { resetOnSuccess: true });
  const { result: removeResult, pending: removeActionPending, formProps: removeActionProps } = useFormAction(removeBrandLogo);

  return (
    <Card>
      <h2 className="mb-4 text-xl">Logo</h2>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
        <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded border border-line bg-cream">
          {logoUrl ? (
            <Image src={logoUrl} alt={`${brandName} logo`} width={112} height={112} className="h-full w-full object-contain p-2" />
          ) : (
            <span className="text-xs text-muted">No logo yet</span>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-3">
          <form {...uploadActionProps} className="flex flex-col gap-3">
            <Field id="logo-file" label={logoUrl ? "Replace logo" : "Upload a logo"} hint="JPG, PNG or WebP, under 4 MB.">
              <Input id="logo-file" name="file" type="file" accept={ACCEPTED_IMAGE_TYPES} required />
            </Field>
            <div className="flex flex-wrap items-center gap-3">
              <SubmitButton pending={uploadActionPending} pendingLabel="Uploading…">Upload logo</SubmitButton>
              <FormStatus result={uploadResult} />
            </div>
          </form>
          {logoUrl && (
            <form {...removeActionProps} className="flex flex-wrap items-center gap-3">
              <SubmitButton pending={removeActionPending} variant="ghost" pendingLabel="Removing…">
                Remove logo
              </SubmitButton>
              <FormStatus result={removeResult} />
            </form>
          )}
        </div>
      </div>
    </Card>
  );
}
