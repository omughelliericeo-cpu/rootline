"use client";
// Delete button for a product.
import { DeleteForm } from "@/ui/DeleteForm";
import { deleteProduct } from "../server/actions";

export function DeleteProduct({ productId, name }: { productId: string; name: string }) {
  return (
    <DeleteForm
      action={deleteProduct}
      fields={{ productId }}
      label="Delete product"
      confirmMessage={`Delete ${name}? This cannot be undone.`}
    />
  );
}
