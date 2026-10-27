// The unsubscribe link in every recall email. Shows one button, so link
// scanners in email systems cannot unsubscribe people by just opening it.
import type { Metadata } from "next";
import Link from "next/link";
import { UnsubscribeForm, isUnsubscribeToken } from "@/features/recalls";
import { Card, Logo } from "@/ui";

export const metadata: Metadata = { title: "Unsubscribe", robots: { index: false } };

/** A thin line-drawn sprig, decorative only (wide screens). */
function Sprig() {
  return (
    <svg aria-hidden="true" viewBox="0 0 120 220" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" className="h-72 w-auto text-sage">
      <path d="M60 215C58 160 62 100 70 10" />
      <path d="M61 180c-20-6-34-22-38-44 22 2 36 18 38 44z" />
      <path d="M62 140c20-8 32-26 34-48-22 4-34 22-34 48z" />
      <path d="M64 100c-18-8-28-24-30-44 20 4 30 20 30 44z" />
      <path d="M67 62c16-8 24-22 26-40-18 4-26 18-26 40z" />
    </svg>
  );
}

export default async function UnsubscribePage({ params }: PageProps<"/recall/unsubscribe/[token]">) {
  const { token } = await params;
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-3xl items-center justify-center gap-10 px-4 py-16">
      <Card className="flex w-full max-w-md flex-col gap-5">
        <Logo />
        <h1 className="text-3xl">Unsubscribe from recall alerts</h1>
        {isUnsubscribeToken(token) ? (
          <>
            <p className="text-muted">You signed up to hear if a batch you bought is recalled. Press the button to stop these emails.</p>
            <UnsubscribeForm token={token} />
          </>
        ) : (
          <p className="text-muted">This unsubscribe link is not valid. Please use the link in the email exactly as it was sent.</p>
        )}
        <Link href="/" className="text-sm">
          Back to home
        </Link>
      </Card>
      <div className="hidden md:block">
        <Sprig />
      </div>
    </main>
  );
}
