"use client";
// Delete button for a supplier.
import { DeleteForm } from "@/ui/DeleteForm";
import { deleteSupplier } from "../server/actions";

export function DeleteSupplier({ supplierId, name }: { supplierId: string; name: string }) {
  return (
    <DeleteForm
      action={deleteSupplier}
      fields={{ supplierId }}
      label="Delete supplier"
      confirmMessage={`Delete ${name}? This cannot be undone.`}
    />
  );
}
