// Zod schemas for starting a subscription and opening the billing portal.
import { z } from "zod";

export const checkoutSchema = z.object({
  plan: z.enum(["STARTER", "GROWTH"]),
  interval: z.enum(["month", "year"]),
});

export const portalSchema = z.object({});
