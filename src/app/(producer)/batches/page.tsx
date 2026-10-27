// Batches list ("Brews", "Bakes"...), newest first, with search.
import type { Metadata } from "next";
import { totalScans } from "@/features/analytics";
import { BatchList, listBatches } from "@/features/batches";
import { getTemplate } from "@/features/industries";
import { requireOwner } from "@/lib/auth";
import { ButtonLink, PageShell, SearchBox, matchesQuery, queryParam } from "@/ui";

export const metadata: Metadata = { title: "Batches" };

export default async function BatchesPage({ searchParams }: PageProps<"/batches">) {
  const owner = await requireOwner();
  const template = getTemplate(owner.industry);
  const query = queryParam((await searchParams).q);
  const all = await listBatches(owner);
  const batches = all.filter((batch) => matchesQuery(query, batch.productName, `${template.labels.batch} ${batch.number}`, batch.code));
  const scans = await totalScans(owner, batches.map((batch) => batch.id));
  const newLabel = `New ${template.labels.batch.toLowerCase()}`;

  return (
    <PageShell title={template.labels.batches} description="Each one has its own QR code and story page.">
      {all.length > 0 && (
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <SearchBox label={`Search ${template.labels.batches.toLowerCase()}`} query={query} action="/batches" />
          <ButtonLink href="/batches/new">{newLabel}</ButtonLink>
        </div>
      )}
      <BatchList batches={batches} template={template} timeZone={owner.timezone} scans={scans} query={query} />
    </PageShell>
  );
}
