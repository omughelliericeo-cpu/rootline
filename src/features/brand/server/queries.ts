// Brand reads and the sign-up insert. All queries run through withTenant, so
// row-level security limits them to the owner's own brand.
import "server-only";
import { TRIAL_DAYS } from "@/features/billing";
import type { Owner } from "@/lib/auth";
import { withTenant } from "@/lib/db";
import { publicMediaUrl } from "@/lib/storage";
import type { NewBrandInput } from "../schema";

export type BrandPersonView = { id: string; name: string; role: string; photoUrl: string | null };

export type BrandProfileView = {
  id: string;
  industry: string;
  name: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
  colorPrimary: string;
  colorAccent: string;
  quote: string | null;
  videoUrl: string | null;
  logoUrl: string | null;
  photos: Array<{ path: string; url: string }>;
  people: BrandPersonView[];
};

export async function createBrandForOwner(input: NewBrandInput): Promise<{ id: string }> {
  return withTenant({ userId: input.userId }, (tx) =>
    tx.brand.create({
      data: {
        ownerUserId: input.userId,
        industry: input.industry,
        name: input.name,
        location: input.location,
        // Every new brand starts with a free Growth trial (see the billing feature).
        plan: "GROWTH",
        trialEndsAt: new Date(Date.now() + TRIAL_DAYS * 86_400_000),
      },
      select: { id: true },
    }),
  );
}

export async function getBrandProfile(owner: Owner): Promise<BrandProfileView> {
  const brand = await withTenant({ userId: owner.userId, brandId: owner.brandId }, (tx) =>
    tx.brand.findUniqueOrThrow({
      where: { id: owner.brandId },
      include: { people: { orderBy: [{ position: "asc" }, { createdAt: "asc" }] } },
    }),
  );

  return {
    id: brand.id,
    industry: brand.industry,
    name: brand.name,
    location: brand.location,
    latitude: brand.latitude,
    longitude: brand.longitude,
    colorPrimary: brand.colorPrimary,
    colorAccent: brand.colorAccent,
    quote: brand.quote,
    videoUrl: brand.videoUrl,
    logoUrl: brand.logoPath ? publicMediaUrl(brand.logoPath) : null,
    photos: brand.photoPaths.map((path) => ({ path, url: publicMediaUrl(path) })),
    people: brand.people.map((person) => ({
      id: person.id,
      name: person.name,
      role: person.role,
      photoUrl: person.photoPath ? publicMediaUrl(person.photoPath) : null,
    })),
  };
}

/** The id of the user's brand, if they already have one (e.g. a repeated sign-up). */
export async function findBrandIdForOwner(userId: string): Promise<string | null> {
  const brand = await withTenant({ userId }, (tx) =>
    tx.brand.findUnique({ where: { ownerUserId: userId }, select: { id: true } }),
  );
  return brand?.id ?? null;
}

/**
 * Deletes the owner's brand. Everything that belongs to it (people, suppliers, products,
 * certificates, batches, scans, recall sign-ups, shelf codes, shopper photos) goes with it
 * through ON DELETE CASCADE. Uploaded files are removed separately (removeAllBrandFiles).
 */
export async function deleteBrandForOwner(owner: Owner): Promise<void> {
  await withTenant({ userId: owner.userId, brandId: owner.brandId }, (tx) => tx.brand.delete({ where: { id: owner.brandId } }));
}
