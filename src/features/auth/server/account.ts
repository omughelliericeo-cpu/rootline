"use server";
// Deleting a producer account for good. In order:
//  1. re-check the password (someone at an unlocked computer can't do this);
//  2. cancel any Stripe subscription, so a deleted account is never charged again
//     (if Stripe can't be reached, stop here and remove nothing);
//  3. delete the brand, which removes all its rows (ON DELETE CASCADE);
//  4. remove its uploaded files from storage;
//  5. delete the login from Supabase Auth, then end the session.
// Steps 4 and 5 run after the data is gone; a failure there is logged for us to finish
// by hand, and the owner still sees their account as deleted.
import { redirect } from "next/navigation";
import { cancelSubscriptionNow } from "@/features/billing";
import { deleteBrandForOwner } from "@/features/brand";
import { defineOwnerAction } from "@/lib/action";
import { AppError, ValidationError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { removeAllBrandFiles } from "@/lib/storage";
import { supabaseAdmin, supabaseServer } from "@/lib/supabase";
import { deleteAccountSchema } from "../schema";
import { passwordMatches } from "./verify-password";

export const deleteAccount = defineOwnerAction({
  feature: "auth",
  action: "deleteAccount",
  input: deleteAccountSchema,
  handler: async ({ password }, { owner, requestId }) => {
    if (!(await passwordMatches(owner.email, password))) {
      throw new ValidationError({ password: ["That isn't your password"] });
    }
    const log = { feature: "auth", action: "deleteAccount", requestId, brandId: owner.brandId };

    const cancelled = await cancelSubscriptionNow(owner);
    try {
      await deleteBrandForOwner(owner);
    } catch (error) {
      throw new AppError("ACCOUNT_DELETE_FAILED", undefined, { cause: error });
    }
    logger.info("account data deleted", { ...log, subscriptionCancelled: cancelled });

    await removeAllBrandFiles(owner.brandId).then(
      (files) => logger.info("account files removed", { ...log, files }),
      (error) => logger.error("account files not removed: remove the brand's storage folders by hand", { ...log, error }),
    );

    const { error: authError } = await supabaseAdmin().auth.admin.deleteUser(owner.userId);
    if (authError) logger.error("login not deleted: delete the user in Supabase Auth by hand", { ...log, userId: owner.userId, error: authError });

    const supabase = await supabaseServer();
    await supabase.auth.signOut({ scope: "local" }).catch(() => undefined);
    redirect("/login?notice=deleted");
  },
});
