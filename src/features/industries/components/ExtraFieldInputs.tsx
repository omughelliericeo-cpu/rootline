// Renders a template's industry-specific fields (e.g. alcohol % for beer,
// grade and size for eggs) as form inputs named "extra.<key>". Used by the
// product form now and the batch form later. No logic beyond choosing the input.
import { Field, Input, Select } from "@/ui";
import type { FieldDefinition } from "../template.schema";

type ExtraFieldInputsProps = {
  fields: FieldDefinition[];
  values?: Record<string, unknown>;
  errors?: Record<string, string[]>;
};

export function ExtraFieldInputs({ fields, values = {}, errors = {} }: ExtraFieldInputsProps) {
  if (fields.length === 0) return null;
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {fields.map((field) => {
        const id = `extra-${field.key}`;
        const error = errors[`extra.${field.key}`]?.[0];
        const label = field.unit ? `${field.label} (${field.unit})` : field.label;
        const value = values[field.key] === undefined ? "" : String(values[field.key]);
        return (
          <Field key={field.key} id={id} label={field.required ? label : `${label} (optional)`} hint={field.hint} error={error}>
            {field.kind === "select" ? (
              <Select
                id={id}
                name={`extra.${field.key}`}
                options={(field.options ?? []).map((option) => ({ value: option, label: option }))}
                placeholder="Choose one"
                defaultValue={value}
                required={field.required}
                invalid={!!error}
              />
            ) : (
              <Input
                id={id}
                name={`extra.${field.key}`}
                type={field.kind === "date" ? "date" : "text"}
                inputMode={field.kind === "number" ? "decimal" : undefined}
                defaultValue={value}
                required={field.required}
                invalid={!!error}
              />
            )}
          </Field>
        );
      })}
    </div>
  );
}
