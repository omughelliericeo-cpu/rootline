"use client";
// Deleting the account (Account page): the password and the word DELETE, so it can't
// happen by accident or from someone else at an unlocked computer.
import { fieldError } from "@/lib/result";
import { Field, FormStatus, Input, SubmitButton } from "@/ui";
import { useFormAction } from "@/ui/useFormAction";
import { DELETE_WORD } from "../schema";
import { deleteAccount } from "../server/account";

export function DeleteAccountForm() {
  const { result, pending, formProps } = useFormAction(deleteAccount);
  const error = (field: string) => fieldError(result, field);
  return (
    <form {...formProps} className="flex max-w-md flex-col gap-5">
      <Field id="deletePassword" label="Your password" error={error("password")}>
        <Input id="deletePassword" name="password" type="password" required autoComplete="current-password" invalid={!!error("password")} />
      </Field>
      <Field id="confirmWord" label={`Type ${DELETE_WORD} to confirm`} error={error("confirmWord")}>
        <Input id="confirmWord" name="confirmWord" required autoComplete="off" spellCheck={false} invalid={!!error("confirmWord")} />
      </Field>
      <SubmitButton variant="danger" pending={pending} pendingLabel="Deleting…" className="self-start">
        Delete my account
      </SubmitButton>
      <FormStatus result={result} />
    </form>
  );
}
