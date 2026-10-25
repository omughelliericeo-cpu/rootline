// Certificates list with their current state.
import type { Metadata } from "next";
import { CertificateList, listCertificates } from "@/features/certificates";
import { getTemplate } from "@/features/industries";
import { requireOwner } from "@/lib/auth";
import { ButtonLink, PageShell } from "@/ui";

export const metadata: Metadata = { title: "Certificates" };

export default async function CertificatesPage() {
  const owner = await requireOwner();
  const certificates = await listCertificates(owner);

  return (
    <PageShell
      title="Certificates"
      description="A claim shows as a badge only while its certificate is valid and in date."
      actions={certificates.length > 0 && <ButtonLink href="/certificates/new">Upload a certificate</ButtonLink>}
    >
      <CertificateList
        certificates={certificates}
        template={getTemplate(owner.industry)}
        now={new Date()}
        timeZone={owner.timezone}
      />
    </PageShell>
  );
}
