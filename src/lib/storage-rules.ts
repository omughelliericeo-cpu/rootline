// Pure rules for uploaded files: which files are accepted and where they are
// stored. Separate from storage.ts so they can be unit tested.

/** Vercel caps request bodies at 4.5 MB, so uploads stay below that. */
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
/** Kept for existing callers. */
export const MAX_IMAGE_BYTES = MAX_UPLOAD_BYTES;

const IMAGE_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const CERTIFICATE_EXTENSIONS: Record<string, string> = {
  ...IMAGE_EXTENSIONS,
  "application/pdf": "pdf",
};

export const ACCEPTED_IMAGE_TYPES = Object.keys(IMAGE_EXTENSIONS).join(",");
export const ACCEPTED_CERTIFICATE_TYPES = Object.keys(CERTIFICATE_EXTENSIONS).join(",");

export type MediaKind = "logo" | "photo" | "person" | "product" | "supplier" | "shopper" | "certificate";

type FileInfo = { type: string; size: number };

function checkFile(file: FileInfo, extensions: Record<string, string>, typesText: string): string | null {
  if (!extensions[file.type]) return `Upload a ${typesText} file.`;
  if (file.size === 0) return "That file is empty.";
  if (file.size > MAX_UPLOAD_BYTES) return "That file is larger than 4 MB. Please make it smaller and try again.";
  return null;
}

/** Returns a user-facing problem, or null if the image is fine. SVG is refused: it can carry scripts. */
export function checkImageFile(file: FileInfo): string | null {
  return checkFile(file, IMAGE_EXTENSIONS, "JPG, PNG or WebP");
}

/** Certificates may also be PDFs. */
export function checkCertificateFile(file: FileInfo): string | null {
  return checkFile(file, CERTIFICATE_EXTENSIONS, "PDF, JPG, PNG or WebP");
}

/**
 * "{brandId}/{kind}/{random}.{ext}". A random name (never the user's file
 * name) avoids collisions, odd characters and path tricks, and lets files be
 * cached forever because a changed file always gets a new path.
 */
export function storagePathFor(brandId: string, kind: MediaKind, mimeType: string): string {
  const extension = CERTIFICATE_EXTENSIONS[mimeType] ?? "bin";
  return `${brandId}/${kind}/${crypto.randomUUID()}.${extension}`;
}
