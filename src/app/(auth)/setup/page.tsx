// Finish setting up: a logged-in account with no brand lands here (see
// requireOwner in src/lib/auth.ts) and creates one.
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { FinishSetupForm } from "@/features/auth";
import { findBrandIdForOwner } from "@/features/brand";
import { getSessionUser } from "@/lib/auth";
import { PageShell } from "@/ui";

export const metadata: Metadata = { title: "Finish setting up" };

export default async function SetupPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (await findBrandIdForOwner(user.id)) redirect("/dashboard");

  return (
    <PageShell
      eyebrow="One more step"
      title="Finish setting up"
      description={`You're logged in as ${user.email}, but there's no business set up for this account yet. Tell us what you make to continue.`}
      width="narrow"
    >
      <FinishSetupForm />
    </PageShell>
  );
}
