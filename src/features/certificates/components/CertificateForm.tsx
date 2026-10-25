"use client";
// Upload a certificate: the claim (from the industry's allowed badges), who
// issued it, when it expires, what it covers, and the file itself.
import { fieldError } from "@/lib/result";
import { ACCEPTED_CERTIFICATE_TYPES } from "@/lib/storage-rules";
import { Card, Field, FormStatus, Input, Select, SubmitButton, type SelectOption } from "@/ui";
import { useFormAction } from "@/ui/useFormAction";
import { uploadCertificate } from "../server/actions";

type CertificateFormProps = { claims: SelectOption[]; coverOptions: SelectOption[]; today: string };

export function CertificateForm({ claims, coverOptions, today }: CertificateFormProps) {
  const { result, pending: formActionPending, formProps: formActionProps } = useFormAction(uploadCertificate);
  const error = (field: string) => fieldError(result, field);

  return (
    <Card>
      <form {...formActionProps} className="flex flex-col gap-5">
        <Field id="claim" label="Claim" hint="Only these claims can become badges for your industry." error={error("claim")}>
          <Select id="claim" name="claim" options={claims} placeholder="Choose one" required invalid={!!error("claim")} />
        </Field>
        <Field id="issuer" label="Issued by" hint="e.g. B Lab, BC Certified Organic" error={error("issuer")}>
          <Input id="issuer" name="issuer" maxLength={120} required invalid={!!error("issuer")} />
        </Field>
        <Field id="expiresOn" label="Expiry date" hint="The badge disappears automatically after this day." error={error("expiresOn")}>
          <Input id="expiresOn" name="expiresOn" type="date" min={today} required invalid={!!error("expiresOn")} />
        </Field>
        <Field id="appliesTo" label="Covers" error={error("appliesTo")}>
          <Select id="appliesTo" name="appliesTo" options={coverOptions} defaultValue="brand" required invalid={!!error("appliesTo")} />
        </Field>
        <Field id="file" label="Certificate file" hint="PDF, JPG, PNG or WebP, under 4 MB. Kept private; shoppers see it only while it is valid." error={error("file")}>
          <Input id="file" name="file" type="file" accept={ACCEPTED_CERTIFICATE_TYPES} required invalid={!!error("file")} />
        </Field>
        <div className="flex flex-wrap items-center gap-4">
          <SubmitButton pending={formActionPending} pendingLabel="Uploading…">Upload certificate</SubmitButton>
          <FormStatus result={result} />
        </div>
      </form>
    </Card>
  );
}
