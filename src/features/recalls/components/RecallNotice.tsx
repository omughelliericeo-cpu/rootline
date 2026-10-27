// Story page: a clear warning at the very top when the producer has issued a
// recall for this batch, so anyone who scans it sees it, signed up or not.
export type PublicRecall = { subject: string; body: string; sentAt: Date };

export function RecallNotice({ recalls, timeZone }: { recalls: PublicRecall[]; timeZone: string }) {
  if (recalls.length === 0) return null;
  const date = new Intl.DateTimeFormat("en-CA", { dateStyle: "medium", timeZone });
  return (
    <section role="alert" aria-labelledby="recall-heading" className="border-b-4 border-danger bg-card px-5 py-5">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-danger">Recall notice</p>
      {recalls.map((recall) => (
        <div key={`${recall.sentAt.toISOString()}-${recall.subject}`} className="mt-2 flex flex-col gap-2">
          <h2 id="recall-heading" className="text-xl">
            {recall.subject}
          </h2>
          <p className="whitespace-pre-line text-sm">{recall.body}</p>
          <p className="text-xs text-muted">Issued {date.format(recall.sentAt)}</p>
        </div>
      ))}
    </section>
  );
}
