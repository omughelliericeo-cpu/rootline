// The brand's shelf codes: where each hangs, its QR code, and which batch it shows.
import { Card, type SelectOption } from "@/ui";
import { DeleteForm } from "@/ui/DeleteForm";
import { deleteShelfCode } from "../server/actions";
import type { ShelfCodeView } from "../server/shelf-codes";
import { shelfUrl } from "../service";
import { QrCard } from "./QrCard";
import { PointShelfCodeForm } from "./ShelfCodeForms";

type ShelfCodeListProps = { shelfCodes: ShelfCodeView[]; batchOptions: SelectOption[]; appUrl: string };

export function ShelfCodeList({ shelfCodes, batchOptions, appUrl }: ShelfCodeListProps) {
  if (shelfCodes.length === 0) {
    return <p className="text-muted">No shelf codes yet.</p>;
  }
  return (
    <ul className="flex flex-col gap-4">
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
  );
}
