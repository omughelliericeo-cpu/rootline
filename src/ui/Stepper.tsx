// Numbered progress for multi-step flows (e.g. New batch: 1 Product & dates,
// 2 Lots, 3 Print). Purely visual; the page decides which step is current.
import { cx } from "./cx";

export function Stepper({ steps, current }: { steps: string[]; current: number }) {
  return (
    <ol className="flex gap-2" aria-label="Progress">
      {steps.map((label, index) => {
        const state = index < current ? "done" : index === current ? "current" : "todo";
        return (
          <li key={label} className="flex flex-1 flex-col gap-1.5" aria-current={state === "current" ? "step" : undefined}>
            <span className={cx("h-1 rounded", state === "todo" ? "bg-line" : "bg-forest")} />
            <span className={cx("text-xs", state === "current" ? "font-medium text-ink" : "text-muted")}>
              {index + 1}. {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
