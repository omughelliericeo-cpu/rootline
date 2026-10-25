// A plain surface for grouping content: card background, thin line border.
import type { ComponentProps } from "react";
import { cx } from "./cx";

type CardProps = ComponentProps<"div"> & { padded?: boolean };

export function Card({ padded = true, className, ...rest }: CardProps) {
  return <div className={cx("rounded border border-line bg-card", padded && "p-5 sm:p-6", className)} {...rest} />;
}
