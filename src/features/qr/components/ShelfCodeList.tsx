// The brand's shelf codes: a summary table (where each hangs and which batch
// it shows), then one card per code with its QR code and controls.
import { Badge, Card, Table, Td, Th, type SelectOption } from "@/ui";
import { DeleteForm } from "@/ui/DeleteForm";
import { deleteShelfCode } from "../server/actions";
import type { ShelfCodeView } from "../server/shelf-codes";
import { shelfUrl } from "../service";
import { QrCard } from "./QrCard";
import { PointShelfCodeForm } from "./ShelfCodeForms";

type ShelfCodeListProps = { shelfCodes: ShelfCodeView[]; batchOptions: SelectOption[]; appUrl: string; batchLabel: string };

export function ShelfCodeList({ shelfCodes, batchOptions, appUrl, batchLabel }: ShelfCodeListProps) {
  if (shelfCodes.length === 0) {
    return <p className="text-muted">No shelf codes yet.</p>;
  }
  return (
    <div className="flex flex-col gap-6">
      <Table caption="Shelf codes">
        <thead>
          <tr>
            <Th>Shelf code</Th>
            <Th>Shows</Th>
            <Th>Status</Th>
          </tr>
        </thead>
        <tbody>
          {shelfCodes.map((shelfCode) => (
            <tr key={shelfCode.id}>
              <Td className="font-medium">{shelfCode.label}</Td>
              <Td className="text-muted">{shelfCode.batch ? `${shelfCode.batch.productName}, ${batchLabel} ${shelfCode.batch.number}` : "Nothing yet"}</Td>
              <Td>
                {shelfCode.batch?.status === "LIVE" ? <Badge tone="live">Active</Badge> : <Badge tone="draft">{shelfCode.batch ? "Not on sale" : "Not pointed"}</Badge>}
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
      <ul className="grid gap-4 md:grid-cols-2">
      {shelfCodes.map((shelfCode) => (
        <li key={shelfCode.id}>
          <Card className="flex flex-col gap-5">
            <h2 className="text-xl">{shelfCode.label}</h2>
            <QrCard
              url={shelfUrl(appUrl, shelfCode.code)}
              label={`Shelf QR code for ${shelfCode.label}`}
              downloadPath={`/shelf-codes/${shelfCode.id}/qr`}
              size="small"
            />
            <PointShelfCodeForm shelfCodeId={shelfCode.id} currentBatchId={shelfCode.batch?.id ?? null} batchOptions={batchOptions} />
            <DeleteForm
              action={deleteShelfCode}
              fields={{ shelfCodeId: shelfCode.id }}
              label="Delete shelf code"
              confirmMessage={`Delete the “${shelfCode.label}” shelf code? Printed copies will stop working.`}
            />
          </Card>
        </li>
      ))}
      </ul>
    </div>
  );
}
