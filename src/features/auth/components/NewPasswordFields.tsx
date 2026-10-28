// The "new password" and "type it again" fields, shared by the reset and change forms.
import { Field, Input } from "@/ui";

export function NewPasswordFields({ error }: { error: (field: string) => string | undefined }) {
  return (
    <>
      <Field id="password" label="New password" hint="At least 8 characters." error={error("password")}>
        <Input id="password" name="password" type="password" minLength={8} maxLength={72} required autoComplete="new-password" invalid={!!error("password")} />
      </Field>
      <Field id="confirmPassword" label="New password again" error={error("confirmPassword")}>
        <Input id="confirmPassword" name="confirmPassword" type="password" required autoComplete="new-password" invalid={!!error("confirmPassword")} />
      </Field>
    </>
  );
}
