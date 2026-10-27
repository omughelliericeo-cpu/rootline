// Layout for sign-up and login: the form on the left under the Rootline
// header, and a tall photo with a caption on the right (large screens only).
import Image from "next/image";
import type { ReactNode } from "react";
import { AuthHeaderLink } from "@/features/auth";
import { Logo } from "@/ui";
import sidePhoto from "../../../public/photos/auth/side.jpg";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-svh bg-cream lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <div className="flex flex-col">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-line px-4 py-5 sm:px-8">
          <Logo />
          <AuthHeaderLink />
        </header>
        <div className="flex-1">{children}</div>
      </div>
      <aside className="relative hidden lg:block" aria-hidden="true">
        <Image src={sidePhoto} alt="" fill priority sizes="40vw" className="object-cover" />
        <div className="absolute inset-x-0 bottom-0 bg-ink/45 px-10 py-10 text-card">
          <p className="text-xs font-medium uppercase tracking-[0.14em]">— Real food. Real people.</p>
          <p className="mt-2 font-serif text-4xl leading-tight">From our farms to your table.</p>
        </div>
      </aside>
    </div>
  );
}
