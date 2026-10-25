// Zod schemas for certificate forms. The claim is checked against the
// brand's template, and the product/supplier against the brand, in the action.
import { z } from "zod";
import { requiredFile, requiredText } from "@/lib/form";
import { parseScope } from "./service";

export const uploadCertificateSchema = z.object({
  claim: z.string({ error: "Choose the claim" }).min(1, "Choose the claim"),
  issuer: requiredText("Issued by", 120),
  expiresOn: z.string({ error: "Enter the expiry date" }).regex(/^\d{4}-\d{2}-\d{2}$/, "Enter the expiry date"),
  appliesTo: z.string({ error: "Choose what it covers" }).transform((value, ctx) => {
    const scope = parseScope(value);
    if (!scope) {
      ctx.addIssue({ code: "custom", message: "Choose what it covers" });
      return z.NEVER;
    }
    return scope;
  }),
  file: requiredFile,
});

export const certificateIdSchema = z.object({ certificateId: z.uuid() });

export type UploadCertificateInput = z.infer<typeof uploadCertificateSchema>;
