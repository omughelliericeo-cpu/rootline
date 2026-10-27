// A headline number with an optional change chip, e.g. "128" with "+18% vs last week".
import { cx } from "./cx";

type StatNumberProps = { value: number | string; change?: string | null; changeLabel?: string; inverted?: boolean };

export function StatNumber({ value, change, changeLabel = "vs last week", inverted = false }: StatNumberProps) {
  const falling = change?.startsWith("-");
  return (
    <div className="flex flex-wrap items-end gap-3">
      <p className={cx("font-serif text-5xl leading-none", inverted ? "text-card" : "text-ink")}>{value}</p>
      {change && (
        <p className={cx("pb-1 text-sm", inverted ? "text-card/80" : falling ? "text-brown" : "text-forest")}>
          <span className="font-semibold">{change}</span> {changeLabel}
        </p>
      )}
    </div>
  );
}
