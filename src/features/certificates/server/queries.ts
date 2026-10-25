// Certificate reads for the producer. Row-level security limits them to the
// owner's brand. Files are private: viewing one creates a short-lived link.
import "server-only";
import { tenantOf, type Owner } from "@/lib/auth";
import { withTenant } from "@/lib/db";
import { isUuid } from "@/lib/ids";
import { signedCertificateUrl } from "@/lib/storage";
import type { CertificateFacts } from "../service";

export type CertificateView = CertificateFacts & {
  id: string;
  claim: string;
  issuer: string;
  fileName: string;
  /** "Whole brand", or the product or supplier name. */
  coversLabel: string;
};

export async function listCertificates(owner: Owner): Promise<CertificateView[]> {
  const rows = await withTenant(tenantOf(owner), (tx) =>
    tx.certificate.findMany({
      where: { brandId: owner.brandId },
      orderBy: { expiresOn: "asc" },
      include: { product: { select: { name: true } }, supplier: { select: { name: true } } },
    }),
  );
  return rows.map((row) => ({
    id: row.id,
    claim: row.claim,
    issuer: row.issuer,
    status: row.status,
    expiresOn: row.expiresOn,
    filePath: row.filePath,
    fileName: row.fileName,
    coversLabel: row.product?.name ?? row.supplier?.name ?? "Whole brand",
  }));
}

/** A signed link to the certificate file, or null if it is not this brand's. */
export async function certificateFileUrl(owner: Owner, certificateId: string): Promise<string | null> {
  if (!isUuid(certificateId)) return null;
  const certificate = await withTenant(tenantOf(owner), (tx) =>
    tx.certificate.findFirst({ where: { id: certificateId, brandId: owner.brandId }, select: { filePath: true } }),
  );
  return certificate ? signedCertificateUrl(certificate.filePath) : null;
}
