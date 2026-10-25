// Form field wrapper (label, hint, error) plus matching Input and Textarea.
// Errors are linked to the input with aria-describedby for screen readers.
import type { ComponentProps, ReactNode } from "react";
import { cx } from "./cx";

type FieldProps = {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
};

export function Field({ id, label, hint, error, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-ink">
        {label}
      </label>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="text-sm text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

export const inputClasses =
  "min-h-11 w-full rounded border border-line bg-card px-3 py-2 text-base text-ink " +
  "placeholder:text-muted/70 focus:border-forest focus:outline-none aria-invalid:border-danger";

export function describedBy(id: string, hasError: boolean): string {
  return hasError ? `${id}-error` : `${id}-hint`;
}

type InputProps = ComponentProps<"input"> & { id: string; invalid?: boolean };

export function Input({ id, invalid = false, className, ...rest }: InputProps) {
  return (
    <input
      id={id}
      aria-invalid={invalid || undefined}
      aria-describedby={describedBy(id, invalid)}
      className={cx(inputClasses, className)}
      {...rest}
    />
  );
}

type TextareaProps = ComponentProps<"textarea"> & { id: string; invalid?: boolean };

export function Textarea({ id, invalid = false, className, rows = 4, ...rest }: TextareaProps) {
  return (
    <textarea
      id={id}
      rows={rows}
      aria-invalid={invalid || undefined}
      aria-describedby={describedBy(id, invalid)}
      className={cx(inputClasses, className)}
      {...rest}
    />
  );
}
