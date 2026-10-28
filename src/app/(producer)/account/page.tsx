// Account: the login email, changing the password, and deleting the account.
import type { Metadata } from "next";
import Link from "next/link";
import { ChangePasswordForm, DeleteAccountForm } from "@/features/auth";
import { requireOwner } from "@/lib/auth";
import { Card, PageShell } from "@/ui";

export const metadata: Metadata = { title: "Account" };

const NOTICES: Record<string, string> = {
  password: "Your password has been changed.",
};

export default async function AccountPage({ searchParams }: PageProps<"/account">) {
  const owner = await requireOwner();
  const { notice } = await searchParams;
  const message = typeof notice === "string" ? NOTICES[notice] : undefined;

  return (
    <PageShell title="Account" description="Your login, your password, and closing your account.">
      <div className="flex flex-col gap-6">
        {message && (
          <Card className="border-forest">
            <p role="status" className="text-sm">
              {message}
            </p>
          </Card>
        )}

        <Card>
          <h2 className="text-2xl">Login</h2>
          <p className="mt-2 text-sm text-muted">
            You log in with <strong className="text-ink">{owner.email}</strong>.
          </p>
        </Card>

        <Card>
          <h2 className="mb-1 text-2xl">Change password</h2>
          <p className="mb-5 text-sm text-muted">
            Forgotten your current one? <Link href="/forgot-password">Get a reset link</Link> instead.
          </p>
          <ChangePasswordForm />
        </Card>

        <Card className="border-danger/40">
          <h2 className="mb-1 text-2xl text-danger">Delete account</h2>
          <div className="mb-5 flex flex-col gap-2 text-sm text-muted">
            <p>
              This permanently deletes <strong className="text-ink">{owner.brandName}</strong> and everything in it: products, suppliers,
              certificates, batches, scan history, recall sign-ups, shopper photos and uploaded files. Your story pages and QR codes stop
              working straight away. It can&apos;t be undone.
            </p>
            <p>
              Any paid plan is cancelled at once, with no further charges. Past invoices stay with Stripe, our payment provider, as
              required for tax records. Want a copy of a batch first? Download its compliance export from the batch page.
            </p>
          </div>
          <DeleteAccountForm />
        </Card>
      </div>
    </PageShell>
  );
}
