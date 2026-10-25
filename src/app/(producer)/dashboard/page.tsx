// Producer home. The full dashboard (scans, recalls, expiring certificates)
// arrives in Milestone 6; for now: New batch, and the brand profile.
import type { Metadata } from "next";
import { getTemplate } from "@/features/industries";
import { requireOwner } from "@/lib/auth";
import { ButtonLink, Card, PageShell } from "@/ui";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const owner = await requireOwner();
  const template = getTemplate(owner.industry);

  return (
    <PageShell
      eyebrow={template.name}
      title={owner.brandName}
      actions={<ButtonLink href="/batches/new">New {template.labels.batch.toLowerCase()}</ButtonLink>}
    >
      <Card>
        <h2 className="mb-2 text-xl">Start with your brand profile</h2>
        <p className="mb-5 max-w-prose text-muted">
          Add your logo, photos and the people behind your {template.labels.products.toLowerCase()}. Shoppers see this
          on every story page.
        </p>
        <ButtonLink href="/brand">Edit brand profile</ButtonLink>
      </Card>
    </PageShell>
  );
}
