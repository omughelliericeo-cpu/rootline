// Standard page layout: centred column, generous spacing, serif page title
// and an optional row of actions (e.g. a "New batch" button).
import type { ReactNode } from "react";
import { cx } from "./cx";

type PageShellProps = {
  title: string;
  eyebrow?: string;
  description?: ReactNode;
  actions?: ReactNode;
  width?: "narrow" | "wide";
  children: ReactNode;
};

export function PageShell({ title, eyebrow, description, actions, width = "wide", children }: PageShellProps) {
  return (
    <main className={cx("mx-auto w-full px-4 py-8 sm:px-6 sm:py-12", width === "narrow" ? "max-w-xl" : "max-w-5xl")}>
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-2">
          {eyebrow && <p className="text-xs font-medium uppercase tracking-[0.14em] text-brown">{eyebrow}</p>}
          <h1 className="text-3xl sm:text-4xl">{title}</h1>
          {description && <div className="max-w-prose text-muted">{description}</div>}
        </div>
        {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
      </header>
      {children}
    </main>
  );
}
