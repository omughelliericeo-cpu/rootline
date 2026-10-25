"use server";
// Server actions to upload, revoke and delete certificates.
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getTemplate, hasOption } from "@/features/industries";
import { defineOwnerAction, type ActionContext } from "@/lib/action";
import { tenantOf, type Owner } from "@/lib/auth";
import { dateFromKey, dateKeyIn, daysBetweenKeys } from "@/lib/dates";
import { withTenant, type Tx } from "@/lib/db";
import { AppError, ValidationError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { removeCertificateFiles, uploadCertificateFile } from "@/lib/storage";
import { certificateIdSchema, uploadCertificateSchema } from "../schema";
import type { CertificateScope } from "../service";

/**
 * Foreign keys do not go through row-level security, so check here that the
 * product or supplier really belongs to this brand.
 */
async function assertScopeBelongsToBrand(tx: Tx, owner: Owner, scope: CertificateScope) {
  if (scope.productId) {
    const found = await tx.product.count({ where: { id: scope.productId, brandId: owner.brandId } });
    if (!found) throw new AppError("PRODUCT_NOT_FOUND");
  }
  if (scope.supplierId) {
    const found = await tx.supplier.count({ where: { id: scope.supplierId, brandId: owner.brandId } });
    if (!found) throw new AppError("SUPPLIER_NOT_FOUND");
  }
}

async function removeFileQuietly(path: string, ctx: ActionContext, action: string) {
  try {
    await removeCertificateFiles([path]);
  } catch (error) {
    logger.warn("unused certificate file not removed", { feature: "certificates", action, requestId: ctx.requestId, brandId: ctx.brandId, path, error });
  }
}

export const uploadCertificate = defineOwnerAction({
  feature: "certificates",
  action: "upload",
  input: uploadCertificateSchema,
  handler: async ({ claim, issuer, expiresOn, appliesTo, file }, ctx) => {
    const { owner } = ctx;
    if (!hasOption(getTemplate(owner.industry).allowedBadges, claim)) {
      throw new ValidationError({ claim: ["Choose a claim from the list"] });
    }
    if (daysBetweenKeys(dateKeyIn(new Date(), owner.timezone), expiresOn) < 0) throw new AppError("CERT_EXPIRED");

    const filePath = await uploadCertificateFile(owner.brandId, file);
    try {
      await withTenant(tenantOf(owner), async (tx) => {
        await assertScopeBelongsToBrand(tx, owner, appliesTo);
        await tx.certificate.create({
          data: {
            brandId: owner.brandId,
            productId: appliesTo.productId,
            supplierId: appliesTo.supplierId,
            claim,
            issuer,
            expiresOn: dateFromKey(expiresOn),
            filePath,
            fileName: file.name.slice(0, 200) || "certificate",
            fileType: file.type,
          },
        });
      });
    } catch (error) {
      await removeFileQuietly(filePath, ctx, "upload");
      throw error;
    }
    revalidatePath("/certificates");
    redirect("/certificates");
  },
});

export const revokeCertificate = defineOwnerAction({
  feature: "certificates",
  action: "revoke",
  input: certificateIdSchema,
  handler: async ({ certificateId }, { owner }) => {
    const result = await withTenant(tenantOf(owner), (tx) =>
      tx.certificate.updateMany({ where: { id: certificateId, brandId: owner.brandId }, data: { status: "REVOKED" } }),
    );
    if (result.count === 0) throw new AppError("CERT_NOT_FOUND");
    revalidatePath("/certificates");
    return { message: "Certificate revoked. Its badge no longer shows." };
  },
});

export const deleteCertificate = defineOwnerAction({
  feature: "certificates",
  action: "delete",
  input: certificateIdSchema,
  handler: async ({ certificateId }, ctx) => {
    const { owner } = ctx;
    const filePath = await withTenant(tenantOf(owner), async (tx) => {
      const existing = await tx.certificate.findFirst({ where: { id: certificateId, brandId: owner.brandId } });
      if (!existing) throw new AppError("CERT_NOT_FOUND");
      await tx.certificate.delete({ where: { id: certificateId } });
      return existing.filePath;
    });
    await removeFileQuietly(filePath, ctx, "delete");
    revalidatePath("/certificates");
    return { message: "Certificate deleted." };
  },
});
