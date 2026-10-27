// "Find on map" for one producer: looks an address up and prefers places
// near the brand ("Surrey" from a Port Moody brewery means Surrey, BC, not
// Surrey, England). Used by GET /api/geocode.
import "server-only";
import type { Owner } from "./auth";
import { tenantOf } from "./auth";
import { withTenant } from "./db";
import { AppError } from "./errors";
import { geocodeCandidates } from "./geocode";
import { closestMatch, mapLink } from "./geocode-rules";

export type CoordinatesSuggestion = { coordinates: string; placeName: string; mapUrl: string };

/** Where the brand is: its saved map position, or else its town looked up. */
async function brandReferencePoint(owner: Owner) {
  const brand = await withTenant(tenantOf(owner), (tx) =>
    tx.brand.findUniqueOrThrow({ where: { id: owner.brandId }, select: { latitude: true, longitude: true, location: true } }),
  );
  if (brand.latitude !== null && brand.longitude !== null) return { latitude: brand.latitude, longitude: brand.longitude };
  const [town] = await geocodeCandidates(brand.location);
  return town ?? null;
}

export async function suggestCoordinates(owner: Owner, address: string): Promise<CoordinatesSuggestion> {
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
}
