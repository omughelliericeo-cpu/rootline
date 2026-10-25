// Batches list ("Brews", "Bakes"...), newest first.
import type { Metadata } from "next";
import { BatchList, listBatches } from "@/features/batches";
import { getTemplate } from "@/features/industries";
import { requireOwner } from "@/lib/auth";
import { ButtonLink, PageShell } from "@/ui";

export const metadata: Metadata = { title: "Batches" };

export default async function BatchesPage() {
  const owner = await requireOwner();
  const template = getTemplate(owner.industry);
  const batches = await listBatches(owner);

  return (
    <PageShell
      title={template.labels.batches}
      description="Each one has its own QR code and story page."
      actions={batches.length > 0 && <ButtonLink href="/batches/new">New {template.labels.batch.toLowerCase()}</ButtonLink>}
    >
      <BatchList batches={batches} template={template} timeZone={owner.timezone} />
    </PageShell>
  );
}
