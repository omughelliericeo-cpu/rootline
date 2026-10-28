"use client";
// "Choose a new password", reached from the reset link.
import { fieldError } from "@/lib/result";
import { Card, FormStatus, SubmitButton } from "@/ui";
import { useFormAction } from "@/ui/useFormAction";
import { setNewPassword } from "../server/password";
import { NewPasswordFields } from "./NewPasswordFields";

export function SetNewPasswordForm() {
  const { result, pending, formProps } = useFormAction(setNewPassword);
  const error = (field: string) => fieldError(result, field);
  return (
    <Card>
      <form {...formProps} className="flex flex-col gap-5">
        <NewPasswordFields error={error} />
        <SubmitButton pending={pending} fullWidth pendingLabel="Saving…">
          Save new password
        </SubmitButton>
        <FormStatus result={result} />
      </form>
    </Card>
  );
}
