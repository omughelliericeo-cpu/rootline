// Shared loading for the /batches/{id}/... pages: the logged-in owner, their
// template and the batch, or a "not found" page if it is not theirs.
import "server-only";
import { notFound } from "next/navigation";
import { getTemplate, type IndustryTemplate } from "@/features/industries";
import { requireOwner, type Owner } from "@/lib/auth";
import { batchName, publishProblems } from "../service";
import { getBatch, type BatchDetail } from "./queries";

export type BatchPageData = {
  owner: Owner;
  template: IndustryTemplate;
  batch: BatchDetail;
  /** e.g. "Hazy Pale Ale, Brew 214" */
  name: string;
  /** What is missing before it can be published (empty when ready). */
  problems: string[];
};

export async function loadBatchPage(batchId: string): Promise<BatchPageData> {
  const owner = await requireOwner();
  const batch = await getBatch(owner, batchId);
  if (!batch) notFound();
  const template = getTemplate(owner.industry);
  return {
    owner,
    template,
    batch,
    name: batchName(batch.productName, template.labels.batch, batch.number),
    problems: publishProblems({ lots: batch.lots, stops: batch.stops, packagedAt: batch.packagedAt, template }),
  };
}

/** The three steps of "New batch", in the industry's words. */
export function newBatchSteps(template: IndustryTemplate): string[] {
  return [`${template.labels.product} & dates`, "Lots", "Print"];
}
