// Pure parts of address lookup (geocoding), kept separate so they can be
// unit tested without calling the real service.
import { z } from "zod";

export type GeocodeMatch = { latitude: number; longitude: number; placeName: string };

const nominatimResults = z.array(
  z.object({
    lat: z.coerce.number(),
    lon: z.coerce.number(),
    display_name: z.string(),
  }),
);

/** Reads OpenStreetMap Nominatim's JSON answer into matches (empty when nothing was found or the answer is odd). */
export function parseNominatim(body: unknown): GeocodeMatch[] {
  const parsed = nominatimResults.safeParse(body);
  if (!parsed.success) return [];
  return parsed.data
    .filter((item) => Math.abs(item.lat) <= 90 && Math.abs(item.lon) <= 180)
    .map((item) => ({ latitude: item.lat, longitude: item.lon, placeName: item.display_name }));
}

type Point = { latitude: number; longitude: number };

/** Distance in km along the Earth's surface (haversine formula). */
export function distanceKm(a: Point, b: Point): number {
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const dLat = toRadians(b.latitude - a.latitude);
  const dLon = toRadians(b.longitude - a.longitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRadians(a.latitude)) * Math.cos(toRadians(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

/**
 * Of several places with the same name ("Surrey" in England and in BC),
 * prefer ones near the brand, but within that area keep the search's own
 * ranking: "Lillooet" should be the town, not the slightly closer centre of
 * the surrounding district. Without a reference point, the top match wins.
 */
export function closestMatch(matches: GeocodeMatch[], near: Point | null): GeocodeMatch | null {
  if (matches.length === 0) return null;
  if (!near) return matches[0]!;
  const distances = matches.map((match) => distanceKm(match, near));
  // "Near enough": up to 1.5x the nearest match's distance, plus 50 km of slack.
  const nearEnough = Math.min(...distances) * 1.5 + 50;
  return matches.find((_, index) => distances[index]! <= nearEnough)!;
}

/** Same address typed with different spacing or capitals should hit the same cache entry. */
export function normaliseAddress(address: string): string {
  return address.trim().replace(/\s+/g, " ").toLowerCase();
}

/** A link to check a position on openstreetmap.org. */
export function mapLink(latitude: number, longitude: number): string {
  return `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=15/${latitude}/${longitude}`;
}
