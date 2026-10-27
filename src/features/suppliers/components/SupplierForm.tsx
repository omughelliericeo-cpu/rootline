"use client";
// Add or edit a supplier. The source types come from the brand's template.
import { fieldError } from "@/lib/result";
import { ACCEPTED_IMAGE_TYPES } from "@/lib/storage-rules";
import { Card, Field, FormStatus, Input, Photo, Select, SubmitButton, type SelectOption } from "@/ui";
import { MapPositionField } from "@/ui/MapPositionField";
import { useFormAction } from "@/ui/useFormAction";
import { createSupplier, updateSupplier } from "../server/actions";
import type { SupplierView } from "../server/queries";
import { formatCoordinates } from "../service";

type SupplierFormProps = { supplier?: SupplierView; sourceTypes: SelectOption[] };

export function SupplierForm({ supplier, sourceTypes }: SupplierFormProps) {
  const { result, pending: formActionPending, formProps: formActionProps } = useFormAction(supplier ? updateSupplier : createSupplier);
  const error = (field: string) => fieldError(result, field);

  return (
    <Card>
      <form {...formActionProps} className="flex flex-col gap-5">
        {supplier && <input type="hidden" name="supplierId" value={supplier.id} />}
        <Field id="name" label="Name" hint="The farm or business, e.g. Kowalski Farm" error={error("name")}>
          <Input id="name" name="name" defaultValue={supplier?.name} maxLength={100} required invalid={!!error("name")} />
        </Field>
        <Field id="sourceType" label="Type" error={error("sourceType")}>
          <Select id="sourceType" name="sourceType" options={sourceTypes} placeholder="Choose one" defaultValue={supplier?.sourceType ?? ""} required invalid={!!error("sourceType")} />
        </Field>
        <Field id="supplies" label="What they supply" hint="e.g. Pilsner malt, Citra hops" error={error("supplies")}>
          <Input id="supplies" name="supplies" defaultValue={supplier?.supplies} maxLength={120} required invalid={!!error("supplies")} />
        </Field>
        <Field id="address" label="Address" error={error("address")}>
          <Input id="address" name="address" defaultValue={supplier?.address} maxLength={200} required autoComplete="street-address" invalid={!!error("address")} />
        </Field>
        <MapPositionField
          id="coordinates"
          name="coordinates"
          addressInputId="address"
          defaultValue={supplier ? formatCoordinates(supplier) : ""}
          required
          error={error("coordinates")}
        />
        <div className="flex flex-col gap-3">
          {supplier?.photoUrl && (
            <div className="w-40">
              <Photo src={supplier.photoUrl} alt={`${supplier.name}`} aspect="landscape" sizes="160px" />
            </div>
          )}
          <Field
            id="photo"
            label={supplier?.photoUrl ? "Replace photo (optional)" : "Photo (optional)"}
            hint="A real photo of the farm or place. Shoppers see it when they tap this source. JPG, PNG or WebP, under 4 MB."
            error={error("photo")}
          >
            <Input id="photo" name="photo" type="file" accept={ACCEPTED_IMAGE_TYPES} />
          </Field>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <SubmitButton pending={formActionPending}>{supplier ? "Save supplier" : "Add supplier"}</SubmitButton>
          <FormStatus result={result} />
        </div>
      </form>
    </Card>
  );
}
