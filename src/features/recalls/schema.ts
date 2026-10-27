// Zod schemas for recall sign-up, sending a recall, and unsubscribing.
import { z } from "zod";
import { requiredText } from "@/lib/form";

const ticked = (message: string) => z.literal("on", { error: message });

export const subscribeSchema = z.object({
  batchCode: z.string().min(1).max(20),
  email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address")).pipe(z.string().max(254)),
  consent: ticked("Tick the box to agree"),
});

export const sendRecallSchema = z.object({
  batchId: z.uuid(),
  subject: requiredText("What is wrong", 120),
  body: requiredText("Message", 4000),
  confirm: ticked("Tick the box to confirm"),
});

export const unsubscribeSchema = z.object({ token: z.string().min(1).max(64) });
