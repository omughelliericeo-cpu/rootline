// "Choose a new password": opened from the reset email. Only works while the
// reset link's session and its recovery cookie are valid (30 minutes).
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SetNewPasswordForm, hasRecoveryCookie } from "@/features/auth";
import { getSessionUser } from "@/lib/auth";
import { PageShell } from "@/ui";

export const metadata: Metadata = { title: "Choose a new password" };

export default async function ResetPasswordPage() {
  const user = await getSessionUser();
  if (!user || !(await hasRecoveryCookie(user.id))) redirect("/forgot-password?error=expired");
  return (
    <PageShell title="Choose a new password" description={`For ${user.email}. You'll stay logged in afterwards.`} width="narrow">
      <SetNewPasswordForm />
    </PageShell>
  );
}
