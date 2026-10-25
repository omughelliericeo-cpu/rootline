// Upload a certificate. "Covers" lists the whole brand, each product and each supplier.
import type { Metadata } from "next";
import Link from "next/link";
import { CertificateForm } from "@/features/certificates";
import { getTemplate } from "@/features/industries";
import { listProducts } from "@/features/products";
import { listSuppliers } from "@/features/suppliers";
import { requireOwner } from "@/lib/auth";
import { dateKeyIn } from "@/lib/dates";
import { PageShell } from "@/ui";

export const metadata: Metadata = { title: "Upload a certificate" };

export default async function NewCertificatePage() {
  const owner = await requireOwner();
  const template = getTemplate(owner.industry);
  const [products, suppliers] = await Promise.all([listProducts(owner), listSuppliers(owner)]);

  const coverOptions = [
    { value: "brand", label: `Whole brand (${owner.brandName})` },
    ...products.map((product) => ({ value: `product:${product.id}`, label: `${template.labels.product}: ${product.name}` })),
    ...suppliers.map((supplier) => ({ value: `supplier:${supplier.id}`, label: `Supplier: ${supplier.name}` })),
  ];

  return (
    <PageShell title="Upload a certificate" width="narrow" description={<Link href="/certificates">Back to certificates</Link>}>
      <CertificateForm
        claims={template.allowedBadges.map((badge) => ({ value: badge.id, label: badge.label }))}
        coverOptions={coverOptions}
        today={dateKeyIn(new Date(), owner.timezone)}
      />
    </PageShell>
  );
}
