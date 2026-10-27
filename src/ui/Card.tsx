// A plain surface for grouping content: card background, thin line border.
// tone="accent": the forest-green card for the one figure that should stand out.
import type { ComponentProps } from "react";
import { cx } from "./cx";

type CardProps = ComponentProps<"div"> & { padded?: boolean; tone?: "plain" | "accent" };

export function Card({ padded = true, tone = "plain", className, ...rest }: CardProps) {
  return (
    <div
      className={cx(
        "rounded border",
        tone === "accent" ? "border-forest bg-forest text-card" : "border-line bg-card",
        padded && "p-5 sm:p-6",
        className,
      )}
      {...rest}
    />
  );
}
