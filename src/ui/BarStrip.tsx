// A small bar chart drawn with plain HTML (no chart library, no JavaScript).
// Screen readers get the same numbers from a visually hidden table.
type Bar = { label: string; value: number };

export function BarStrip({ bars, title, unit = "scans" }: { bars: Bar[]; title: string; unit?: string }) {
  const max = Math.max(1, ...bars.map((bar) => bar.value));
  return (
    <figure className="flex flex-col gap-2">
      <div className="flex h-20 items-end gap-1" aria-hidden="true">
        {bars.map((bar) => (
          <div
            key={bar.label}
            title={`${bar.label}: ${bar.value} ${unit}`}
            className={bar.value === 0 ? "flex-1 rounded-sm bg-line" : "flex-1 rounded-sm bg-forest"}
            style={{ height: `${Math.max(6, (bar.value / max) * 100)}%` }}
          />
        ))}
      </div>
      <figcaption className="flex justify-between text-xs text-muted" aria-hidden="true">
        <span>{bars[0]?.label}</span>
        <span>{bars.at(-1)?.label}</span>
      </figcaption>
      <table className="sr-only">
        <caption>{title}</caption>
        <tbody>
          {bars.map((bar) => (
            <tr key={bar.label}>
              <th scope="row">{bar.label}</th>
              <td>
                {bar.value} {unit}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
