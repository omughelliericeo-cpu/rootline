// Map positions: reading one pasted from a map app, and writing it back.
// Pure functions shared by suppliers and journey stops (safe in the browser).

export type Coordinates = { latitude: number; longitude: number };

/**
 * Accepts "49.2838, -122.8317" (what Google Maps copies when you right-click
 * a place), "49.2838 -122.8317" or "49.2838,-122.8317". Returns null when the
 * text is not two numbers in range.
 */
export function parseCoordinates(text: string): Coordinates | null {
  const parts = text.trim().split(/[\s,]+/).filter(Boolean);
  if (parts.length !== 2) return null;
  const [latitude, longitude] = parts.map(Number) as [number, number];
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return null;
  return { latitude, longitude };
}

/** Back to the text form for editing. Five decimals is about one metre. */
export function formatCoordinates({ latitude, longitude }: Coordinates): string {
  return `${Number(latitude.toFixed(5))}, ${Number(longitude.toFixed(5))}`;
}
