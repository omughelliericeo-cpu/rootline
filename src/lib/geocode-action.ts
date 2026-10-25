"use server";
// Server action behind the "Find on map" button. Logged-in producers only, so
// the public cannot use Rootline to make lookups on OpenStreetMap's service.
// Results are biased towards the brand: "Surrey" from a Port Moody brewery
// means Surrey, BC, not Surrey, England.
import { z } from "zod";
import { defineOwnerAction } from "./action";
import { tenantOf, type Owner } from "./auth";
import { withTenant } from "./db";
import { AppError } from "./errors";
import { geocodeCandidates } from "./geocode";
import { closestMatch, mapLink } from "./geocode-rules";

/** Where the brand is: its saved map position, or else its town looked up. */
async function brandReferencePoint(owner: Owner) {
  const brand = await withTenant(tenantOf(owner), (tx) =>
    tx.brand.findUniqueOrThrow({ where: { id: owner.brandId }, select: { latitude: true, longitude: true, location: true } }),
  );
  if (brand.latitude !== null && brand.longitude !== null) return { latitude: brand.latitude, longitude: brand.longitude };
  const [town] = await geocodeCandidates(brand.location);
  return town ?? null;
}

export const findCoordinates = defineOwnerAction({
  feature: "geocode",
  action: "findCoordinates",
  input: z.object({ address: z.string().trim().min(3, "Type an address first").max(200) }),
  handler: async ({ address }, { owner }) => {
    let match;
    try {
      match = closestMatch(await geocodeCandidates(address), await brandReferencePoint(owner));
    } catch (error) {
      throw new AppError("GEOCODE_UNAVAILABLE", undefined, { cause: error });
    }
    if (!match) throw new AppError("GEOCODE_NOT_FOUND");
    return {
      coordinates: `${Number(match.latitude.toFixed(5))}, ${Number(match.longitude.toFixed(5))}`,
      placeName: match.placeName,
      mapUrl: mapLink(match.latitude, match.longitude),
    };
  },
});
