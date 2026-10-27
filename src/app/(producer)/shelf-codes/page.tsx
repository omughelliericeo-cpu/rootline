// Shelf codes: reusable QR codes for taps, fridges and stalls, pointed at the
// batch currently on sale.
import type { Metadata } from "next";
import { UpgradeNotice, ownerCan } from "@/features/billing";
import { batchName, listBatches } from "@/features/batches";
import { getTemplate } from "@/features/industries";
import { CreateShelfCodeForm, ShelfCodeList, listShelfCodes } from "@/features/qr";
import { requireOwner } from "@/lib/auth";
import { serverConfig } from "@/lib/config";
import { PageShell } from "@/ui";

export const metadata: Metadata = { title: "Shelf codes" };

const STATUS_NOTE: Record<string, string> = { DRAFT: " (draft, not visible yet)", SOLD_OUT: " (sold out)", LIVE: "" };

export default async function ShelfCodesPage() {
  const owner = await requireOwner();
  const template = getTemplate(owner.industry);
  const [shelfCodes, batches] = await Promise.all([listShelfCodes(owner), listBatches(owner)]);
  const batchOptions = batches.map((batch) => ({
    value: batch.id,
    label: batchName(batch.productName, template.labels.batch, batch.number) + STATUS_NOTE[batch.status],
  }));

  return (
    <PageShell
      title="Shelf codes"
      description={`Print once and leave in place: a tap, a fridge, a market stall. When a new ${template.labels.batch.toLowerCase()} goes on sale, point the code at it here.`}
    >
      <div className="flex flex-col gap-6">
        {ownerCan(owner, "shelfCodes") ? (
          <CreateShelfCodeForm batchOptions={batchOptions} />
        ) : (
          <UpgradeNotice title="Reusable shelf codes are part of Growth">
            Print one code for a tap, fridge or market stall and point it at whichever batch is on sale. Existing codes keep working.
          </UpgradeNotice>
        )}
        <ShelfCodeList shelfCodes={shelfCodes} batchOptions={batchOptions} appUrl={serverConfig().APP_URL} batchLabel={template.labels.batch} />
      </div>
    </PageShell>
  );
}
