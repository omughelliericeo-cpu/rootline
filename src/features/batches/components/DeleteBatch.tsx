"use client";
// Delete button for a draft batch.
import { DeleteForm } from "@/ui/DeleteForm";
import { deleteBatch } from "../server/actions";

export function DeleteBatch({ batchId, name }: { batchId: string; name: string }) {
  return (
    <DeleteForm
      action={deleteBatch}
      fields={{ batchId }}
      label="Delete draft"
      confirmMessage={`Delete the draft ${name}? This cannot be undone.`}
    />
  );
}
