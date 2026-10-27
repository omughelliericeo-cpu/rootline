"use client";
// Connects a <form> to a server action (made with defineAction) and keeps
// what the user typed when the action fails.
//
// Why: React 19 clears a form after every `action` submission, even a failed
// one, so a producer who mistyped one field would lose everything. This hook
// submits through onSubmit instead (no automatic clearing) and keeps
// `action` as well, so the form still works before JavaScript loads.
//
//   const { result, pending, formProps } = useFormAction(saveThing, { resetOnSuccess: true });
//   <form {...formProps}> ... <SubmitButton pending={pending}>Save</SubmitButton>
import { startTransition, useActionState, useEffect, useRef, useState, type FormEvent } from "react";
import type { Result } from "@/lib/result";

type Options = {
  /** Clear the form after a successful submit (e.g. "Add person"). */
  resetOnSuccess?: boolean;
  /** Ask before submitting (e.g. deletes). Skipped when JavaScript is off. */
  confirmMessage?: string;
  /** Changes the data before it is sent (e.g. shrinking a photo). Skipped when JavaScript is off. */
  prepare?: (data: FormData) => Promise<FormData>;
};

export function useFormAction<T>(
  action: (previousState: unknown, form: FormData) => Promise<Result<T>>,
  { resetOnSuccess = false, confirmMessage, prepare }: Options = {},
) {
  const [result, formAction, actionPending] = useActionState<Result<T> | null, FormData>(action, null);
  const [preparing, setPreparing] = useState(false);
  const pending = actionPending || preparing;
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (resetOnSuccess && result?.ok) formRef.current?.reset();
  }, [result, resetOnSuccess]);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (confirmMessage && !window.confirm(confirmMessage)) return;
    const submitter = (event.nativeEvent as SubmitEvent).submitter;
    const data = new FormData(event.currentTarget, submitter);
    if (!prepare) {
      startTransition(() => formAction(data));
      return;
    }
    setPreparing(true);
    prepare(data)
      .then((prepared) => startTransition(() => formAction(prepared)))
      .finally(() => setPreparing(false));
  }

  return { result, pending, formProps: { ref: formRef, action: formAction, onSubmit } };
}
