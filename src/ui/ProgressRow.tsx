// A labelled bar showing one value against the largest in a list,
// e.g. one batch's scans compared with the most-scanned batch.
export function ProgressRow({ label, value, max, href }: { label: string; value: number; max: number; href?: string }) {
  const width = max > 0 ? Math.max(4, (value / max) * 100) : 0;
  const text = (
    <span className="flex items-baseline justify-between gap-3 text-sm">
      <span className="truncate">{label}</span>
      <span className="shrink-0 text-muted">{value}</span>
    </span>
  );
  return (
    <div className="flex flex-col gap-1.5">
      {href ? (
        <a href={href} className="text-ink no-underline hover:text-forest">
          {text}
        </a>
      ) : (
        text
      )}
      <div className="h-2 rounded-sm bg-line" aria-hidden="true">
        <div className="h-2 rounded-sm bg-forest" style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}
