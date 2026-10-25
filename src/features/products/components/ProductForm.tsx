"use client";
// Add or edit a product. Pick-lists and extra fields come from the brand's
// industry template, so the same form serves beer, bread, eggs, coffee and wine.
import { ExtraFieldInputs, type IndustryTemplate } from "@/features/industries";
import { fieldError } from "@/lib/result";
import { ACCEPTED_IMAGE_TYPES } from "@/lib/storage-rules";
import { Card, CheckboxGroup, Field, FormStatus, Input, Photo, SubmitButton, Textarea } from "@/ui";
import { useFormAction } from "@/ui/useFormAction";
import { createProduct, updateProduct } from "../server/actions";
import type { ProductView } from "../server/queries";
import { splitKnown } from "../service";

type ProductFormProps = {
  product?: ProductView;
  template: Pick<IndustryTemplate, "labels" | "productFields" | "starterIngredients" | "starterAllergens" | "dietaryTags">;
};

export function ProductForm({ product, template }: ProductFormProps) {
  const { result, pending: formActionPending, formProps: formActionProps } = useFormAction(product ? updateProduct : createProduct);
  const error = (field: string) => fieldError(result, field);
  const ingredients = splitKnown(product?.ingredients ?? [], template.starterIngredients);
  const allergens = splitKnown(product?.allergens ?? [], template.starterAllergens);
  const fieldErrors = result && !result.ok ? result.error.fieldErrors : undefined;
  const productWord = template.labels.product.toLowerCase();

  return (
    <Card>
      <form {...formActionProps} className="flex flex-col gap-6">
        {product && <input type="hidden" name="productId" value={product.id} />}
        <Field id="name" label="Name" hint={`As it appears on the ${productWord}'s label`} error={error("name")}>
          <Input id="name" name="name" defaultValue={product?.name} maxLength={100} required invalid={!!error("name")} />
        </Field>
        <Field id="format" label="Format" hint="Size and pack, e.g. 473 ml can" error={error("format")}>
          <Input id="format" name="format" defaultValue={product?.format} maxLength={80} required invalid={!!error("format")} />
        </Field>

        <ExtraFieldInputs fields={template.productFields} values={product?.extra} errors={fieldErrors} />

        <CheckboxGroup name="ingredients" legend="Ingredients" hint="Tick what goes in, in label order." options={template.starterIngredients} selected={ingredients.ticked} />
        <Field id="ingredientsOther" label="Other ingredients (optional)" hint="Separate with commas." error={error("ingredientsOther")}>
          <Textarea id="ingredientsOther" name="ingredientsOther" defaultValue={ingredients.other} rows={2} maxLength={500} />
        </Field>

        <CheckboxGroup name="allergens" legend="Allergens" options={template.starterAllergens} selected={allergens.ticked} />
        <Field id="allergensOther" label="Other allergens (optional)" hint="Separate with commas." error={error("allergensOther")}>
          <Input id="allergensOther" name="allergensOther" defaultValue={allergens.other} maxLength={300} />
        </Field>

        <CheckboxGroup name="dietaryTags" legend="Dietary tags (optional)" options={template.dietaryTags} selected={product?.dietaryTags} error={error("dietaryTags")} />

        <div className="flex flex-col gap-3">
          {product?.photoUrl && (
            <div className="w-40">
              <Photo src={product.photoUrl} alt={product.name} aspect="square" sizes="160px" />
            </div>
          )}
          <Field id="photo" label={product?.photoUrl ? "Replace photo (optional)" : "Photo (optional)"} hint="Used as the story page photo for this product's batches. Under 4 MB.">
            <Input id="photo" name="photo" type="file" accept={ACCEPTED_IMAGE_TYPES} />
          </Field>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <SubmitButton pending={formActionPending}>{product ? "Save product" : "Add product"}</SubmitButton>
          <FormStatus result={result} />
        </div>
      </form>
    </Card>
  );
}
