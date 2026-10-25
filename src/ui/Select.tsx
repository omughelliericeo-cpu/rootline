// Native <select> styled to match Input. Native is used on purpose: it gives
// the best picker on phones and works without JavaScript.
import type { ComponentProps } from "react";
import { cx } from "./cx";
import { describedBy, inputClasses } from "./Field";

export type SelectOption = { value: string; label: string };

type SelectProps = Omit<ComponentProps<"select">, "children"> & {
  id: string;
  options: SelectOption[];
  placeholder?: string;
  invalid?: boolean;
};

export function Select({ id, options, placeholder, invalid = false, className, ...rest }: SelectProps) {
  return (
    <select
      id={id}
      aria-invalid={invalid || undefined}
      aria-describedby={describedBy(id, invalid)}
      className={cx(inputClasses, "appearance-auto", className)}
      {...rest}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
