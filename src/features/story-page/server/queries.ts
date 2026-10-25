// Loads everything a public story page shows, in public mode (withPublic):
// row-level security only lets published batches and their story through.
import "server-only";
import { cache } from "react";
import { isPublicCode } from "@/lib/codes";
import { withPublic } from "@/lib/db";
import { storedDateKey } from "@/lib/dates";
import type { RawStory } from "../service";

/** The story for a batch code, or null if there is no published batch with that code. */
export const loadStory = cache(async (code: string): Promise<RawStory | null> => {
  if (!isPublicCode(code)) return null;
  return withPublic(async (tx) => {
    const batch = await tx.batch.findUnique({
      where: { code },
      include: {
        product: true,
        brand: { include: { people: { orderBy: [{ position: "asc" }, { createdAt: "asc" }] } } },
        lots: { orderBy: { position: "asc" }, include: { supplier: true } },
        stops: { orderBy: { position: "asc" } },
      },
    });
    // RLS already hides drafts; the status check keeps this safe even if a policy changes.
    if (!batch || (batch.status !== "LIVE" && batch.status !== "SOLD_OUT")) return null;

    const supplierIds = [...new Set(batch.lots.map((lot) => lot.supplierId))];
    const certificates = await tx.certificate.findMany({
      where: {
        brandId: batch.brandId,
        OR: [{ productId: null, supplierId: null }, { productId: batch.productId }, { supplierId: { in: supplierIds } }],
      },
    });

    const { product, brand, lots, stops } = batch;
    return {
      batch: { id: batch.id, code: batch.code, number: batch.number, status: batch.status, madeAt: batch.madeAt, packagedAt: batch.packagedAt },
      product: {
        id: product.id,
        name: product.name,
        format: product.format,
        ingredients: product.ingredients,
        allergens: product.allergens,
        dietaryTags: product.dietaryTags,
        photoPath: product.photoPath,
      },
      brand: {
        name: brand.name,
        location: brand.location,
        industry: brand.industry,
        timezone: brand.timezone,
        logoPath: brand.logoPath,
        photoPaths: brand.photoPaths,
        colorPrimary: brand.colorPrimary,
        quote: brand.quote,
        videoUrl: brand.videoUrl,
      },
      people: brand.people.map((person) => ({ name: person.name, role: person.role, photoPath: person.photoPath })),
      lots: lots.map((lot) => ({
        ingredient: lot.ingredient,
        lotNumber: lot.lotNumber,
        supplier: {
          id: lot.supplier.id,
          name: lot.supplier.name,
          sourceType: lot.supplier.sourceType,
          address: lot.supplier.address,
          latitude: lot.supplier.latitude,
          longitude: lot.supplier.longitude,
        },
      })),
      stops: stops.map((stop) => ({
        name: stop.name,
        type: stop.type,
        address: stop.address,
        latitude: stop.latitude,
        longitude: stop.longitude,
        arrivedOn: stop.arrivedOn ? storedDateKey(stop.arrivedOn) : null,
        note: stop.note,
      })),
      certificates: certificates.map((certificate) => ({
        id: certificate.id,
        claim: certificate.claim,
        issuer: certificate.issuer,
        status: certificate.status,
        expiresOn: certificate.expiresOn,
        filePath: certificate.filePath,
        productId: certificate.productId,
        supplierId: certificate.supplierId,
      })),
    };
  });
});
