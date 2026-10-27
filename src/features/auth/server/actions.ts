"use server";
// Sign-up, login and logout. Supabase Auth stores the account and password;
// we create the brand row (one owner per brand) at sign-up.
import { redirect } from "next/navigation";
import { createBrandForOwner, findBrandIdForOwner } from "@/features/brand";
import { defineAction } from "@/lib/action";
import { serverConfig } from "@/lib/config";
import { AppError } from "@/lib/errors";
import { getSessionUser } from "@/lib/auth";
import { supabaseAdmin, supabaseServer } from "@/lib/supabase";
import { finishSetupSchema, logInSchema, logOutSchema, signUpSchema, type SignUpResult } from "../schema";
import { authErrorCode, isRepeatSignUp, safeNextPath } from "../service";

export const signUp = defineAction({
  feature: "auth",
  action: "signUp",
  input: signUpSchema,
  handler: async ({ industry, brandName, location, email, password }, ctx): Promise<SignUpResult> => {
    const supabase = await supabaseServer();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${serverConfig().APP_URL}/auth/confirm` },
    });
    if (error) throw new AppError(authErrorCode(error), undefined, { cause: error });
    if (!data.user || isRepeatSignUp(data.user)) throw new AppError("AUTH_EMAIL_TAKEN");

    const userId = data.user.id;
    // Signing up again before confirming re-sends the email for the same user;
    // their brand already exists, so do not create a second one.
    const existingBrandId = await findBrandIdForOwner(userId);
    if (existingBrandId) {
      ctx.setBrandId(existingBrandId);
    } else {
      try {
        const brand = await createBrandForOwner({ userId, industry, name: brandName, location });
        ctx.setBrandId(brand.id);
      } catch (brandError) {
        // Without a brand the account is unusable; remove it so they can sign up again.
        await supabaseAdmin().auth.admin.deleteUser(userId).catch(() => undefined);
        throw brandError;
      }
    }

    // With email confirmation switched off, Supabase logs the user in straight away.
    if (data.session) redirect("/dashboard");
    return { status: "check-email", email };
  },
});

/** A logged-in account with no brand creates one, then goes to the dashboard. */
export const finishSetup = defineAction({
  feature: "auth",
  action: "finishSetup",
  input: finishSetupSchema,
  handler: async ({ industry, brandName, location }, ctx) => {
    const user = await getSessionUser();
    if (!user) throw new AppError("UNAUTHENTICATED");
    const existingBrandId = await findBrandIdForOwner(user.id);
    if (existingBrandId) {
      ctx.setBrandId(existingBrandId);
    } else {
      const brand = await createBrandForOwner({ userId: user.id, industry, name: brandName, location });
      ctx.setBrandId(brand.id);
    }
    redirect("/dashboard");
  },
});

export const logIn = defineAction({
  feature: "auth",
  action: "logIn",
  input: logInSchema,
  handler: async ({ email, password, next }) => {
    const supabase = await supabaseServer();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new AppError(authErrorCode(error), undefined, { cause: error });
    redirect(safeNextPath(next));
  },
});

export const logOut = defineAction({
  feature: "auth",
  action: "logOut",
  input: logOutSchema,
  handler: async () => {
    const supabase = await supabaseServer();
    await supabase.auth.signOut();
    redirect("/login");
  },
});
