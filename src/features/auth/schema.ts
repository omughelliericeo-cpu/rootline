// Zod schemas for sign-up and login forms.
import { z } from "zod";
import { industryIdSchema } from "@/features/industries";
import { optionalText, requiredText } from "@/lib/form";

const email = z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address"));

export const signUpSchema = z.object({
  industry: industryIdSchema,
  brandName: requiredText("Brand name", 80),
  location: requiredText("Location", 120),
  email,
  // Supabase rejects passwords over 72 bytes (bcrypt limit).
  password: z.string().min(8, "Use at least 8 characters").max(72, "Use 72 characters or fewer"),
});

/** Creating the brand for a logged-in account that has none. */
export const finishSetupSchema = signUpSchema.pick({ industry: true, brandName: true, location: true });

export const logInSchema = z.object({
  email,
  password: z.string().min(1, "Enter your password"),
  next: optionalText("next", 300),
});

export const logOutSchema = z.object({});

export type SignUpResult = { status: "check-email"; email: string };
