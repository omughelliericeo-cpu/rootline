// Pure rules for shopper photos: the consent wording, what is shown with a
// photo, and the limits. Unit tested; no database or storage.

export const NOTE_MAX = 280;
export const FIRST_NAME_MAX = 40;
/** Approved photos shown on a story page, newest first. */
export const STORY_PHOTO_LIMIT = 12;
/** Per visitor, kept in memory only (see src/lib/rate-limit.ts). */
export const SHARES_PER_VISITOR = { limit: 5, windowMs: 15 * 60 * 1000 };

export const THANKS_MESSAGE = "Thank you! Your photo will appear here once the maker has had a look at it.";

/** The exact wording the shopper agrees to; stored with the photo. */
export function consentText(brandName: string): string {
  return `I took this photo, and ${brandName} may show it with my note and first name on this page.`;
}

/** Only the first word is kept, so "Sam Okafor" is shown as "Sam" and full names never go public. */
export function firstNameOnly(name: string | undefined): string | null {
  const first = name?.trim().split(/\s+/)[0];
  return first ? first.slice(0, FIRST_NAME_MAX) : null;
}

export function attribution(firstName: string | null): string {
  return firstName ? `${firstName}` : "A shopper";
}

/** The hidden "website" field is invisible to people; only bots fill it in. */
export function looksLikeABot(trapValue: string | undefined): boolean {
  return Boolean(trapValue && trapValue.trim().length > 0);
}

/** Who is asking, for the in-memory rate limit only: the first forwarded address, never stored. */
export function visitorKey(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || headers.get("x-real-ip") || "unknown";
}
