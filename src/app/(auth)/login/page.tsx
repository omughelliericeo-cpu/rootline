// Producer login.
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LogInForm, safeNextPath } from "@/features/auth";
import { getSessionUser } from "@/lib/auth";
import { Card, PageShell } from "@/ui";

export const metadata: Metadata = { title: "Log in" };

const NOTICES: Record<string, string> = {
  confirm: "That confirmation link is invalid or has expired. Try logging in, or sign up again to get a new link.",
};

export default async function LogInPage({ searchParams }: PageProps<"/login">) {
  const { next, error } = await searchParams;
  const nextPath = typeof next === "string" ? safeNextPath(next) : undefined;
  if (await getSessionUser()) redirect(nextPath ?? "/dashboard");

  const notice = typeof error === "string" ? NOTICES[error] : undefined;

  return (
    <PageShell title="Welcome back" description="Log in to your producer account." width="narrow">
      {notice && (
        <Card className="mb-6 border-brown">
          <p role="alert" className="text-sm">
            {notice}
          </p>
        </Card>
      )}
      <LogInForm next={nextPath} />
    </PageShell>
  );
}
