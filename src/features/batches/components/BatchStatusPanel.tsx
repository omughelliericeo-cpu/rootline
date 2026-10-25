"use client";
// The batch's status and the buttons to change it (publish, sold out, back on
// sale, take offline). Before publishing, lists what is still missing.
import { Badge, Card, FormStatus, SubmitButton } from "@/ui";
import { useFormAction } from "@/ui/useFormAction";
import { changeBatchStatus } from "../server/status-actions";
import type { BatchStatus } from "../service";

const STATUS_BADGE: Record<BatchStatus, { tone: "live" | "draft" | "neutral"; label: string }> = {
  DRAFT: { tone: "draft", label: "Draft" },
  LIVE: { tone: "live", label: "Live" },
  SOLD_OUT: { tone: "neutral", label: "Sold out" },
};

export function StatusBadge({ status }: { status: BatchStatus }) {
  const { tone, label } = STATUS_BADGE[status];
  return <Badge tone={tone}>{label}</Badge>;
}

const ACTIONS: Record<BatchStatus, Array<{ to: BatchStatus; label: string; variant: "primary" | "secondary" }>> = {
  DRAFT: [{ to: "LIVE", label: "Publish", variant: "primary" }],
  LIVE: [
    { to: "SOLD_OUT", label: "Mark sold out", variant: "secondary" },
    { to: "DRAFT", label: "Take offline", variant: "secondary" },
  ],
  SOLD_OUT: [{ to: "LIVE", label: "Back on sale", variant: "secondary" }],
};

type BatchStatusPanelProps = { batchId: string; status: BatchStatus; problems: string[] };

export function BatchStatusPanel({ batchId, status, problems }: BatchStatusPanelProps) {
  const { result, pending, formProps } = useFormAction(changeBatchStatus);
  const blocked = status === "DRAFT" && problems.length > 0;

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <h2 className="text-xl">Status</h2>
        <StatusBadge status={status} />
      </div>
      {blocked && (
        <div>
          <p className="mb-2 text-sm font-medium">Before you can publish:</p>
          <ul className="flex list-disc flex-col gap-1 pl-5 text-sm text-muted">
            {problems.map((problem) => (
              <li key={problem}>{problem}</li>
            ))}
          </ul>
        </div>
      )}
      <form {...formProps} className="flex flex-wrap items-center gap-3">
        <input type="hidden" name="batchId" value={batchId} />
        {ACTIONS[status].map((action) => (
          <SubmitButton
            key={action.to}
            name="status"
            value={action.to}
            variant={action.variant}
            pending={pending}
            disabled={action.to === "LIVE" && blocked}
          >
            {action.label}
          </SubmitButton>
        ))}
        <FormStatus result={result} />
      </form>
    </Card>
  );
}
