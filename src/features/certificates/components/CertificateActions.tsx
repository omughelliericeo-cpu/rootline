"use client";
// Revoke and delete buttons for one certificate.
import { FormStatus, SubmitButton } from "@/ui";
import { DeleteForm } from "@/ui/DeleteForm";
import { useFormAction } from "@/ui/useFormAction";
import { deleteCertificate, revokeCertificate } from "../server/actions";

export function CertificateActions({ certificateId, label, revoked }: { certificateId: string; label: string; revoked: boolean }) {
  const { result, pending, formProps } = useFormAction(revokeCertificate, {
    confirmMessage: `Revoke the ${label} certificate? Its badge stops showing straight away.`,
  });

  return (
    <div className="flex flex-wrap items-center gap-3">
      {!revoked && (
        <form {...formProps} className="flex flex-wrap items-center gap-3">
          <input type="hidden" name="certificateId" value={certificateId} />
          <SubmitButton variant="secondary" pending={pending} pendingLabel="Revoking…">
            Revoke
          </SubmitButton>
          <FormStatus result={result} />
        </form>
      )}
      <DeleteForm
        action={deleteCertificate}
        fields={{ certificateId }}
        label="Delete"
        confirmMessage={`Delete the ${label} certificate and its file? This cannot be undone.`}
      />
    </div>
  );
}
