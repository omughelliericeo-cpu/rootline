// Recent batches with their status, newest first.
import Link from "next/link";
import type { IndustryTemplate } from "@/features/industries";
import { ButtonLink, Card } from "@/ui";
import type { BatchSummary } from "../server/queries";
import { batchName } from "../service";
import { StatusBadge } from "./BatchStatusPanel";

const dateFormat = (timeZone: string) => new Intl.DateTimeFormat("en-CA", { day: "numeric", month: "short", year: "numeric", timeZone });

type BatchListProps = { batches: BatchSummary[]; template: IndustryTemplate; timeZone: string };

export function BatchList({ batches, template, timeZone }: BatchListProps) {
  if (batches.length === 0) {
    return (
      <Card>
        <h2 className="mb-2 text-xl">No {template.labels.batches.toLowerCase()} yet</h2>
        <p className="mb-5 max-w-prose text-muted">
          Each {template.labels.batch.toLowerCase()} gets its own QR code and story page. It takes three short steps.
        </p>
        <ButtonLink href="/batches/new">New {template.labels.batch.toLowerCase()}</ButtonLink>
      </Card>
    );
  }

  const format = dateFormat(timeZone);
  return (
    <ul className="flex flex-col gap-3">
      {batches.map((batch) => (
        <li key={batch.id}>
          <Link href={`/batches/${batch.id}`} className="block no-underline">
            <Card className="flex flex-wrap items-center justify-between gap-3 transition-colors hover:border-ink/40">
              <div>
                <h2 className="text-lg">{batchName(batch.productName, template.labels.batch, batch.number)}</h2>
                <p className="text-sm text-muted">
                  {template.dates.made.label} {format.format(batch.madeAt)}
                </p>
              </div>
              <StatusBadge status={batch.status} />
            </Card>
          </Link>
        </li>
      ))}
    </ul>
  );
}
