// Zod schemas for sign-up and login forms.
import { z } from "zod";
import { industryIdSchema } from "@/features/industries";
import { optionalText, requiredText } from "@/lib/form";

// Supabase rejects passwords over 72 bytes (bcrypt limit).
const newPassword = z.string().min(8, "Use at least 8 characters").max(72, "Use 72 characters or fewer");

const email = z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address"));

export const signUpSchema = z.object({
  industry: industryIdSchema,
  brandName: requiredText("Brand name", 80),
  location: requiredText("Location", 120),
  email,
  password: newPassword,
});

/** Creating the brand for a logged-in account that has none. */
export const finishSetupSchema = signUpSchema.pick({ industry: true, brandName: true, location: true });

export const logInSchema = z.object({
  email,
  password: z.string().min(1, "Enter your password"),
  next: optionalText("next", 300),
});

export const logOutSchema = z.object({});

export const forgotPasswordSchema = z.object({ email });

const matching = <T extends { password: string; confirmPassword: string }>(value: T) => value.password === value.confirmPassword;
const mismatch = { message: "The two passwords don't match", path: ["confirmPassword"] };

/** Choosing a new password after opening a reset link. */
export const setNewPasswordSchema = z.object({ password: newPassword, confirmPassword: z.string() }).refine(matching, mismatch);

/** Changing the password while logged in: the current one is asked for again. */
export const changePasswordSchema = z
  .object({ currentPassword: z.string().min(1, "Enter your current password"), password: newPassword, confirmPassword: z.string() })
  .refine(matching, mismatch);

/** The word typed to confirm deleting the account. */
export const DELETE_WORD = "DELETE";

export const deleteAccountSchema = z.object({
  password: z.string().min(1, "Enter your password"),
  confirmWord: z.string().trim().refine((value) => value.toUpperCase() === DELETE_WORD, `Type ${DELETE_WORD} to confirm`),
});

export type ForgotPasswordResult = { status: "sent"; email: string };
export type SignUpResult = { status: "check-email"; email: string };
