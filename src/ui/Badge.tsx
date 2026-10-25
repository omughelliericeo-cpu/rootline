// Small labels. "verified" is only ever used for claims backed by a valid,
// unexpired certificate; the caller decides that, this component only draws it.
import type { ReactNode } from "react";
import { cx } from "./cx";

type Tone = "verified" | "neutral" | "live" | "draft" | "warning";

const TONE_CLASSES: Record<Tone, string> = {
  verified: "border-forest text-forest bg-card",
  neutral: "border-line text-muted bg-card",
  live: "border-forest bg-forest text-card",
  draft: "border-line text-muted bg-cream",
  warning: "border-brown text-brown bg-card",
};

export function Badge({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 rounded border px-2.5 py-1 text-xs font-medium tracking-wide",
        TONE_CLASSES[tone],
      )}
    >
      {tone === "verified" && <CheckIcon />}
      {children}
    </span>
  );
}

function CheckIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 8.5l3 3 7-7" strokeLinecap="square" />
    </svg>
  );
}
