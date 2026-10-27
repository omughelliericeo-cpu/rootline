"use client";
// Producer: write and send a recall for one batch. A tick box (and a final
// confirmation when JavaScript is on) makes sure it is never sent by accident.
import { fieldError } from "@/lib/result";
import { Card, Field, FormStatus, Input, SubmitButton, Textarea } from "@/ui";
import { useFormAction } from "@/ui/useFormAction";
import { sendRecall } from "../server/send-actions";

type SendRecallFormProps = { batchId: string; subscriberCount: number; batchName: string };

export function SendRecallForm({ batchId, subscriberCount, batchName }: SendRecallFormProps) {
  const people = `${subscriberCount} ${subscriberCount === 1 ? "person" : "people"}`;
  const { result, pending, formProps } = useFormAction(sendRecall, {
    resetOnSuccess: true,
    confirmMessage: `Send this recall for ${batchName} to ${people} and show it on the story page?`,
  });
  const error = (field: string) => fieldError(result, field);

  return (
    <Card>
      <h2 className="mb-1 text-xl">Send a recall</h2>
      <p className="mb-5 text-sm text-muted">
        Emailed to the {people} signed up for this batch, one email each, and shown as a warning at the top of its story page.
      </p>
      <form {...formProps} className="flex flex-col gap-5">
        <input type="hidden" name="batchId" value={batchId} />
        <Field id="subject" label="What is wrong" hint="One line, e.g. Possible glass fragments in some cans" error={error("subject")}>
          <Input id="subject" name="subject" maxLength={120} required invalid={!!error("subject")} />
        </Field>
        <Field id="body" label="Message" hint="What shoppers should do: stop using it, return it, refund details, who to contact." error={error("body")}>
          <Textarea id="body" name="body" rows={6} maxLength={4000} required invalid={!!error("body")} />
        </Field>
        <label className="flex min-h-11 items-start gap-3 text-sm">
          <input type="checkbox" name="confirm" required className="mt-1 h-5 w-5 shrink-0 accent-danger" />
          <span>I want to email everyone signed up for this batch now.</span>
        </label>
        {error("confirm") && <p className="text-sm text-danger">{error("confirm")}</p>}
        <div className="flex flex-wrap items-center gap-4">
          <SubmitButton variant="danger" pending={pending} pendingLabel="Sending…">
            Send recall
          </SubmitButton>
          <FormStatus result={result} />
        </div>
      </form>
    </Card>
  );
}
