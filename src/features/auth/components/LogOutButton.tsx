"use client";
// The "Log out" button. Works before JavaScript loads, and shows the typed
// result if logging out ever fails.
import { FormStatus, SubmitButton } from "@/ui";
import { useFormAction } from "@/ui/useFormAction";
import { logOut } from "../server/actions";

export function LogOutButton() {
  const { result, pending, formProps } = useFormAction(logOut);
  return (
    <form {...formProps} className="flex items-center gap-2">
      <SubmitButton variant="ghost" pending={pending} pendingLabel="Logging out…">
        Log out
      </SubmitButton>
      <FormStatus result={result} />
    </form>
  );
}
