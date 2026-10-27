// Recall alerts for one batch: how many people are signed up, send a recall,
// and the recalls already sent.
import type { Metadata } from "next";
import { UpgradeNotice, ownerCan } from "@/features/billing";
import { loadBatchPage } from "@/features/batches";
import { RecallHistory, SendRecallForm, recallSummary } from "@/features/recalls";
import { PageShell } from "@/ui";

export const metadata: Metadata = { title: "Recall alerts" };

export default async function BatchRecallPage({ params }: PageProps<"/batches/[batchId]/recall">) {
  const { batchId } = await params;
  const { owner, template, batch, name } = await loadBatchPage(batchId);
  const summary = await recallSummary(owner, batch.id);

  return (
    <PageShell nested
      title="Recall alerts"
      width="narrow"
      description={
        <>
          {summary.activeSubscribers} {summary.activeSubscribers === 1 ? "person has" : "people have"} asked to be emailed if
          this {template.labels.batch.toLowerCase()} is recalled.
        </>
      }
    >
      <div className="flex flex-col gap-6">
        {!ownerCan(owner, "recallEmails") && (
          <UpgradeNotice title="Recall email alerts are part of Growth">
            On your plan, a recall shows as a warning on the story page. With Growth, shoppers can also sign up to be emailed, and each recall reaches them directly.
          </UpgradeNotice>
        )}
        <SendRecallForm batchId={batch.id} subscriberCount={summary.activeSubscribers} batchName={name} />
        <RecallHistory messages={summary.messages} timeZone={owner.timezone} />
      </div>
    </PageShell>
  );
}
