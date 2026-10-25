"use client";
// Submit button that disables itself and shows a busy label while its form
// is being sent, so people do not double-submit on a slow phone connection.
// Pass `pending` from useFormAction; without it, the form's own status is used.
import type { ComponentProps } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "./Button";

type SubmitButtonProps = Omit<ComponentProps<typeof Button>, "type"> & { pendingLabel?: string; pending?: boolean };

export function SubmitButton({ children, pendingLabel = "Saving…", pending, disabled, ...rest }: SubmitButtonProps) {
  const status = useFormStatus();
  const busy = pending ?? status.pending;
  return (
    <Button type="submit" disabled={busy || disabled} aria-busy={busy || undefined} {...rest}>
      {busy ? pendingLabel : children}
    </Button>
  );
}
