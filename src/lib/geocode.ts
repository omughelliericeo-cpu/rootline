// Address lookup (geocoding) with OpenStreetMap Nominatim: free, no key,
// and the same map data the story page map uses.
// Nominatim's usage policy (https://operations.osmfoundation.org/policies/nominatim/)
// asks for: at most one request per second, an identifying User-Agent,
// caching of results, and credit to OpenStreetMap. All four are done here
// and in the UI. Set GEOCODER_URL to use another Nominatim-compatible server.
import "server-only";
import { serverConfig } from "./config";
import { normaliseAddress, parseNominatim, type GeocodeMatch } from "./geocode-rules";

const DEFAULT_URL = "https://nominatim.openstreetmap.org/search";
const MIN_GAP_MS = 1100;
const TIMEOUT_MS = 5000;
const CACHE_LIMIT = 500;

const cache = new Map<string, GeocodeMatch[]>();
let lastRequest: Promise<unknown> = Promise.resolve();
let lastRequestAt = 0;

/** Runs lookups one at a time, at least ~1 second apart, within this server process. */
function throttled<T>(work: () => Promise<T>): Promise<T> {
  const run = lastRequest.then(async () => {
    const wait = lastRequestAt + MIN_GAP_MS - Date.now();
    if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
    lastRequestAt = Date.now();
    return work();
  });
  lastRequest = run.catch(() => undefined);
  return run;
}

/** Up to five places matching the address, best first (as ranked by the search). */
export async function geocodeCandidates(address: string): Promise<GeocodeMatch[]> {
  const key = normaliseAddress(address);
  const cached = cache.get(key);
  if (cached) return cached;

  const matches = await throttled(async () => {
    const url = new URL(process.env.GEOCODER_URL || DEFAULT_URL);
    url.searchParams.set("q", address);
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("limit", "5");
    const response = await fetch(url, {
      headers: { "User-Agent": `Rootline/0.1 (${serverConfig().APP_URL})`, "Accept-Language": "en" },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`Geocoder answered HTTP ${response.status}`);
    return parseNominatim(await response.json());
  });

  if (cache.size >= CACHE_LIMIT) cache.delete(cache.keys().next().value!);
  cache.set(key, matches);
  return matches;
}
