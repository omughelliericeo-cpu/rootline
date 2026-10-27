// The batches table: name (links to the batch), status, scans and made date,
// newest first.
import Link from "next/link";
import type { IndustryTemplate } from "@/features/industries";
import { ButtonLink, Card, Table, Td, Th } from "@/ui";
import type { BatchSummary } from "../server/queries";
import { batchName } from "../service";
import { StatusBadge } from "./BatchStatusPanel";

const dateFormat = (timeZone: string) => new Intl.DateTimeFormat("en-CA", { day: "numeric", month: "short", year: "numeric", timeZone });

type BatchListProps = {
  batches: BatchSummary[];
  template: IndustryTemplate;
  timeZone: string;
  /** Scans per batch id. */
  scans: Map<string, number>;
  /** Set when a search found nothing. */
  query?: string;
};

export function BatchList({ batches, template, timeZone, scans, query }: BatchListProps) {
  if (batches.length === 0 && query) {
    return <p className="text-muted">No {template.labels.batches.toLowerCase()} match “{query}”.</p>;
  }
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
    <Table caption={template.labels.batches}>
      <thead>
        <tr>
          <Th>{template.labels.batch}</Th>
          <Th>Status</Th>
          <Th className="text-right">Scans</Th>
          <Th>{template.dates.made.label}</Th>
        </tr>
      </thead>
      <tbody>
        {batches.map((batch) => (
          <tr key={batch.id} className="hover:bg-cream">
            <Td>
              <Link href={`/batches/${batch.id}`} className="font-medium text-ink">
                {batchName(batch.productName, template.labels.batch, batch.number)}
              </Link>
            </Td>
            <Td>
              <StatusBadge status={batch.status} />
            </Td>
            <Td className="text-right tabular-nums">{(scans.get(batch.id) ?? 0).toLocaleString("en-CA")}</Td>
            <Td className="whitespace-nowrap text-muted">{format.format(batch.madeAt)}</Td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}
