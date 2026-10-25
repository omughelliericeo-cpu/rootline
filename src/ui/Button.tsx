// Buttons and button-styled links. Every size is at least 44px tall so it is
// easy to tap on a phone.
import Link from "next/link";
import type { ComponentProps } from "react";
import { cx } from "./cx";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: "bg-forest text-card hover:bg-forest/90 border border-forest",
  secondary: "bg-card text-ink border border-line hover:border-ink/40",
  ghost: "bg-transparent text-ink border border-transparent hover:bg-line/40",
  danger: "bg-card text-danger border border-danger/50 hover:bg-danger/5",
};

const BASE =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded px-5 text-sm font-medium no-underline " +
  "transition-colors disabled:cursor-not-allowed disabled:opacity-50";

export function buttonClasses(variant: Variant = "primary", fullWidth = false): string {
  return cx(BASE, VARIANT_CLASSES[variant], fullWidth && "w-full");
}

type ButtonProps = ComponentProps<"button"> & { variant?: Variant; fullWidth?: boolean };

export function Button({ variant = "primary", fullWidth, className, type = "button", ...rest }: ButtonProps) {
  return <button type={type} className={cx(buttonClasses(variant, fullWidth), className)} {...rest} />;
}

type ButtonLinkProps = ComponentProps<typeof Link> & { variant?: Variant; fullWidth?: boolean };

export function ButtonLink({ variant = "primary", fullWidth, className, ...rest }: ButtonLinkProps) {
  return <Link className={cx(buttonClasses(variant, fullWidth), className)} {...rest} />;
}
