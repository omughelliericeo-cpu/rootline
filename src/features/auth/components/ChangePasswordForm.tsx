"use client";
// Changing the password while logged in (Account page). Asks for the current one first.
import { fieldError } from "@/lib/result";
import { Field, FormStatus, Input, SubmitButton } from "@/ui";
import { useFormAction } from "@/ui/useFormAction";
import { changePassword } from "../server/password";
import { NewPasswordFields } from "./NewPasswordFields";

export function ChangePasswordForm() {
  const { result, pending, formProps } = useFormAction(changePassword);
  const error = (field: string) => fieldError(result, field);
  return (
    <form {...formProps} className="flex max-w-md flex-col gap-5">
      <Field id="currentPassword" label="Current password" error={error("currentPassword")}>
        <Input id="currentPassword" name="currentPassword" type="password" required autoComplete="current-password" invalid={!!error("currentPassword")} />
      </Field>
      <NewPasswordFields error={error} />
      <SubmitButton pending={pending} pendingLabel="Saving…" className="self-start">
        Change password
      </SubmitButton>
      <FormStatus result={result} />
    </form>
  );
}
