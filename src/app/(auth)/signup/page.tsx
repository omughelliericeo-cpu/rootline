// Sign-up. Step one asks "What do you make?"; step two (?industry=...) asks
// for the brand and account details.
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { IndustryStep, SignUpForm } from "@/features/auth";
import { getTemplate, isIndustryId } from "@/features/industries";
import { getSessionUser } from "@/lib/auth";
import { PageShell } from "@/ui";

export const metadata: Metadata = { title: "Sign up" };

export default async function SignUpPage({ searchParams }: PageProps<"/signup">) {
  if (await getSessionUser()) redirect("/dashboard");

  const { industry } = await searchParams;
  const chosen = typeof industry === "string" && isIndustryId(industry) ? getTemplate(industry) : null;

  return (
    <PageShell
      eyebrow={chosen ? "Step 2 of 2" : "Step 1 of 2"}
      title={chosen ? `Set up your ${chosen.labels.place.toLowerCase()}` : "Create your Rootline account"}
      width="narrow"
    >
      {chosen ? (
        <SignUpForm industry={chosen.id} industryName={chosen.name} placeLabel={chosen.labels.place} />
      ) : (
        <IndustryStep error={industry ? "Choose what you make from the list" : undefined} />
      )}
      <p className="mt-6 text-sm text-muted">
        Already have an account? <Link href="/login">Log in</Link>
      </p>
    </PageShell>
  );
}
