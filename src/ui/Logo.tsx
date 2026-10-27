// The Rootline mark (a sprout drawn as a line) and the spaced serif wordmark.
// Links home by default.
import Link from "next/link";
import { cx } from "./cx";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M16 29V13" />
      <path d="M16 19c-1-5-5-8-10-8 0 5 4 9 10 8z" />
      <path d="M16 16c1-5 5-8 10-8 0 5-4 9-10 8z" />
      <path d="M16 13c-2-3-2-7 0-10 2 3 2 7 0 10z" />
    </svg>
  );
}

export function Logo({ href = "/", className }: { href?: string; className?: string }) {
  return (
    <Link href={href} className={cx("inline-flex items-center gap-3 text-forest no-underline", className)} aria-label="Rootline home">
      <LogoMark className="h-8 w-8" />
      <span className="font-serif text-lg tracking-[0.14em] text-ink sm:text-xl sm:tracking-[0.18em]">ROOTLINE</span>
    </Link>
  );
}
