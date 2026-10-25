// Short random codes for public links (/b/{code}, /s/{code}).
// The alphabet leaves out characters that are easy to misread on a printed
// label (0/o, 1/l/i), and codes stay short so the QR code stays simple.
const ALPHABET = "23456789abcdefghjkmnpqrstuvwxyz";
export const CODE_LENGTH = 8;

/** e.g. "k7m2q9xd". 31^8 ≈ 850 billion combinations, so guessing one is impractical. */
export function newPublicCode(length = CODE_LENGTH): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, (byte) => ALPHABET[byte % ALPHABET.length]).join("");
}

export function isPublicCode(value: string): boolean {
  return new RegExp(`^[${ALPHABET}]{${CODE_LENGTH}}$`).test(value);
}

/** True for a unique-constraint error (e.g. a code that already exists). */
export function isUniqueViolation(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && (error as { code: unknown }).code === "P2002";
}
