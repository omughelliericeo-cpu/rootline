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
import { startTransition, useActionState, useEffect, useRef, type FormEvent } from "react";
import type { Result } from "@/lib/result";

type Options = {
  /** Clear the form after a successful submit (e.g. "Add person"). */
  resetOnSuccess?: boolean;
  /** Ask before submitting (e.g. deletes). Skipped when JavaScript is off. */
  confirmMessage?: string;
};

export function useFormAction<T>(
  action: (previousState: unknown, form: FormData) => Promise<Result<T>>,
  { resetOnSuccess = false, confirmMessage }: Options = {},
) {
  const [result, formAction, pending] = useActionState<Result<T> | null, FormData>(action, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (resetOnSuccess && result?.ok) formRef.current?.reset();
  }, [result, resetOnSuccess]);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (confirmMessage && !window.confirm(confirmMessage)) return;
    const submitter = (event.nativeEvent as SubmitEvent).submitter;
    const data = new FormData(event.currentTarget, submitter);
    startTransition(() => formAction(data));
  }

  return { result, pending, formProps: { ref: formRef, action: formAction, onSubmit } };
}
