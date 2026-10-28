// "Forgot your password?": emails a link to choose a new one.
import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/features/auth";
import { Card, PageShell } from "@/ui";

export const metadata: Metadata = { title: "Forgot your password?" };

export default async function ForgotPasswordPage({ searchParams }: PageProps<"/forgot-password">) {
  const { error } = await searchParams;
  return (
    <PageShell title="Forgot your password?" description="Enter your email and we'll send you a link to choose a new one." width="narrow">
      {error === "expired" && (
        <Card className="mb-6 border-brown">
          <p role="alert" className="text-sm">
            That reset link is invalid or has expired. Ask for a new one below.
          </p>
        </Card>
      )}
      <ForgotPasswordForm />
    </PageShell>
  );
}
