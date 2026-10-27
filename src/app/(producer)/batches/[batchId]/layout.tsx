// Shared top of every batch page: the batch name, its status and the tab row.
// Each page below renders one section.
import Link from "next/link";
import type { ReactNode } from "react";
import { BatchTabs, StatusBadge, loadBatchPage } from "@/features/batches";

export default async function BatchLayout({ params, children }: LayoutProps<"/batches/[batchId]"> & { children: ReactNode }) {
  const { batchId } = await params;
  const { template, batch, name } = await loadBatchPage(batchId);

  return (
    <main className="mx-auto w-full max-w-5xl px-4 pt-8 sm:px-6 sm:pt-12">
      <Link href="/batches" className="text-sm">
        All {template.labels.batches.toLowerCase()}
      </Link>
      <div className="mb-4 mt-2 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-brown">{template.labels.batch}</p>
          <h1 className="text-3xl sm:text-4xl">{name}</h1>
        </div>
        <StatusBadge status={batch.status} />
      </div>
      <BatchTabs batchId={batch.id} />
      {children}
    </main>
  );
}
