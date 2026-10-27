// The header on public marketing pages (home, pricing): logo, Pricing, Log in, Sign up.
import Link from "next/link";
import { ButtonLink } from "./Button";
import { Logo } from "./Logo";

export function SiteHeader() {
  return (
    <header className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-5 sm:gap-4 sm:px-8">
      <Logo />
      <nav aria-label="Site" className="flex items-center gap-1 sm:gap-4">
        <Link href="/pricing" className="whitespace-nowrap px-1.5 text-sm text-ink no-underline hover:underline sm:px-2">
          Pricing
        </Link>
        <Link href="/login" className="whitespace-nowrap px-1.5 text-sm text-ink no-underline hover:underline sm:px-2">
          Log in
        </Link>
        <ButtonLink href="/signup" className="whitespace-nowrap px-3 sm:px-5">
          Sign up
        </ButtonLink>
      </nav>
    </header>
  );
}
