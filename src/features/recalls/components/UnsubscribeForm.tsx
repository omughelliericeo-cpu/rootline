"use client";
// The unsubscribe page's button. A button (not the link itself) does the
// unsubscribing, because email security scanners open links automatically.
import { FormStatus, SubmitButton } from "@/ui";
import { useFormAction } from "@/ui/useFormAction";
import { unsubscribe } from "../server/subscribe-actions";

export function UnsubscribeForm({ token }: { token: string }) {
  const { result, pending, formProps } = useFormAction(unsubscribe);
  if (result?.ok) {
    return (
      <p role="status" className="text-forest">
        {(result.data as { message: string }).message}
      </p>
    );
  }
  return (
    <form {...formProps} className="flex flex-col gap-3">
      <input type="hidden" name="token" value={token} />
      <SubmitButton pending={pending} pendingLabel="Unsubscribing…">
        Unsubscribe from recall alerts
      </SubmitButton>
      <FormStatus result={result} />
    </form>
  );
}
