// Scan analytics rules. Pure functions, unit tested.

export type CoarseLocation = { country: string | null; region: string | null; city: string | null };

/**
 * A rough location from the hosting provider's geo headers (Vercel sets
 * these from the visitor's IP). Locally there are none, so everything is
 * null. The IP address itself is never read or stored.
 */
export function coarseLocation(headers: Headers): CoarseLocation {
  const read = (name: string, max: number) => {
    const value = headers.get(name);
    if (!value) return null;
    try {
      return decodeURIComponent(value).slice(0, max);
    } catch {
      return null;
    }
  };
  return {
    country: read("x-vercel-ip-country", 2),
    region: read("x-vercel-ip-country-region", 10),
    city: read("x-vercel-ip-city", 80),
  };
}

/** How the shopper arrived: a batch's own QR code, or a reusable shelf code. */
export function scanSource(searchParamVia: unknown): "BATCH" | "SHELF" {
  return searchParamVia === "shelf" ? "SHELF" : "BATCH";
}
