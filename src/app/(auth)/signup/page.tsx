// Sign-up. Step one asks "What do you make?"; step two (?industry=...) asks
// for the brand and account details.
import type { Metadata } from "next";
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
      eyebrow={chosen ? "Create your account · Step 2 of 2" : "Create your account · Step 1 of 2"}
      title={chosen ? `Set up your ${chosen.labels.place.toLowerCase()}` : "What do you make?"}
      description={chosen ? undefined : "Tell us what you produce so we can set up your account with the right words, dates and badges."}
      width="narrow"
    >
      {chosen ? (
        <SignUpForm industry={chosen.id} industryName={chosen.name} placeLabel={chosen.labels.place} />
      ) : (
        <IndustryStep error={industry ? "Choose what you make from the list" : undefined} />
      )}
    </PageShell>
  );
}
