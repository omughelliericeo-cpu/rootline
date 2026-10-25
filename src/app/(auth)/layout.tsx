// Layout for sign-up and login: a quiet top bar with the Rootline name.
import Link from "next/link";
import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <header className="border-b border-line">
        <div className="mx-auto max-w-xl px-4 py-4">
          <Link href="/" className="font-serif text-lg text-ink no-underline">
            Rootline
          </Link>
        </div>
      </header>
      {children}
    </>
  );
}
