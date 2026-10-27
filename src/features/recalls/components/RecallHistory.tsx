// Producer: recalls already sent for a batch, newest first.
import { Card } from "@/ui";
import type { RecallSummary } from "../server/queries";

export function RecallHistory({ messages, timeZone }: { messages: RecallSummary["messages"]; timeZone: string }) {
  if (messages.length === 0) return null;
  const date = new Intl.DateTimeFormat("en-CA", { dateStyle: "medium", timeStyle: "short", timeZone });
  return (
    <Card>
      <h2 className="mb-4 text-xl">Recalls sent</h2>
      <ul className="flex flex-col gap-4">
        {messages.map((message) => (
          <li key={message.id} className="border-b border-line pb-4 last:border-0 last:pb-0">
            <p className="font-medium">{message.subject}</p>
            <p className="text-sm text-muted">
              {date.format(message.sentAt)} · sent to {message.recipientCount}
              {message.failedCount > 0 && <span className="text-danger"> · {message.failedCount} failed</span>}
            </p>
            <p className="mt-2 whitespace-pre-line text-sm">{message.body}</p>
          </li>
        ))}
      </ul>
    </Card>
  );
}
