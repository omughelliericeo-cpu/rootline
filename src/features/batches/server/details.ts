// Shared by "create batch" and "edit batch details": turns the form's dates
// and industry fields into the values to save, using the brand's template.
import "server-only";
import { extraFieldsSchema, getTemplate } from "@/features/industries";
import type { Prisma } from "@/generated/prisma/client";
import { toFieldErrors } from "@/lib/action";
import type { Owner } from "@/lib/auth";
import { dateKeyIn, daysBetweenKeys, zonedDate, zonedDateTime } from "@/lib/dates";
import { ValidationError } from "@/lib/errors";
import type { BatchDetailsInput } from "../schema";

type DetailsFields = Omit<BatchDetailsInput, "batchId">;

export function batchDetailsToRow(owner: Owner, input: DetailsFields) {
  const template = getTemplate(owner.industry);

  const extra = extraFieldsSchema(template.batchFields).safeParse(input.extra);
  if (!extra.success) {
    const errors = toFieldErrors(extra.error);
    throw new ValidationError(Object.fromEntries(Object.entries(errors).map(([key, value]) => [`extra.${key}`, value])));
  }

  const madeAt = template.dates.made.includesTime
    ? zonedDateTime(input.madeOn, input.madeTime ?? "00:00", owner.timezone)
    : zonedDate(input.madeOn, owner.timezone);
  const packagedAt = template.dates.packaged && input.packagedOn ? zonedDate(input.packagedOn, owner.timezone) : null;

  if (packagedAt && daysBetweenKeys(input.madeOn, dateKeyIn(packagedAt, owner.timezone)) < 0) {
    const packagedLabel = template.dates.packaged?.label ?? "Packaged";
    throw new ValidationError({
      packagedOn: [`${packagedLabel} date cannot be before the ${template.dates.made.label.toLowerCase()} date`],
    });
  }

  return { number: input.number, madeAt, packagedAt, extra: extra.data as Prisma.InputJsonObject };
}
