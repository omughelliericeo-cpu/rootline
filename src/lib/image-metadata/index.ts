// Removes hidden metadata from uploaded photos before they are stored: EXIF
// (camera, time and often the GPS position where the photo was taken, e.g. a
// shopper's home), XMP, comments and text chunks. Works on the file's bytes
// for JPEG, PNG and WebP, so no image library is needed and the pixels are
// untouched. It also refuses a file whose bytes are not the claimed type.
import { ImageFormatError, ascii, concat, startsWith } from "./bytes";
import { stripJpeg } from "./jpeg";

export { ImageFormatError } from "./bytes";

export function stripImageMetadata(bytes: Uint8Array, mimeType: string): Uint8Array<ArrayBuffer> {
  if (mimeType === "image/jpeg") return stripJpeg(bytes);
  if (mimeType === "image/png") return stripPng(bytes);
  if (mimeType === "image/webp") return stripWebp(bytes);
  throw new ImageFormatError(`Unsupported image type ${mimeType}`);
}

// PNG: keep only the chunks needed to draw the image correctly.
const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const PNG_KEEP = new Set(["IHDR", "PLTE", "IDAT", "IEND", "tRNS", "gAMA", "cHRM", "sRGB", "iCCP", "sBIT", "bKGD", "pHYs"]);

function stripPng(bytes: Uint8Array): Uint8Array<ArrayBuffer> {
  if (!PNG_SIGNATURE.every((value, i) => bytes[i] === value)) throw new ImageFormatError("Not a PNG file");
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const kept: Uint8Array[] = [bytes.subarray(0, 8)];
  let i = 8;
  while (i + 12 <= bytes.length) {
    const length = view.getUint32(i);
    const end = i + 12 + length;
    if (end > bytes.length) break;
    const type = ascii(bytes, i + 4, 4);
    if (PNG_KEEP.has(type)) kept.push(bytes.subarray(i, end));
    if (type === "IEND") return concat(kept);
    i = end;
  }
  throw new ImageFormatError("Damaged PNG file");
}

// WebP: keep the image, alpha, animation and colour-profile chunks; drop EXIF and XMP.
const WEBP_KEEP = new Set(["VP8 ", "VP8L", "VP8X", "ALPH", "ANIM", "ANMF", "ICCP"]);
const VP8X_EXIF_AND_XMP = 0x08 | 0x04;

function stripWebp(bytes: Uint8Array): Uint8Array<ArrayBuffer> {
  if (!startsWith(bytes, "RIFF") || !startsWith(bytes, "WEBP", 8)) throw new ImageFormatError("Not a WebP file");
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const kept: Uint8Array[] = [];
  let i = 12;
  while (i + 8 <= bytes.length) {
    const type = ascii(bytes, i, 4);
    const size = view.getUint32(i + 4, true);
    const end = i + 8 + size + (size % 2);
    if (i + 8 + size > bytes.length) throw new ImageFormatError("Damaged WebP file");
    if (WEBP_KEEP.has(type)) {
      const chunk = bytes.slice(i, Math.min(end, bytes.length));
      if (type === "VP8X") chunk[8] = chunk[8]! & ~VP8X_EXIF_AND_XMP;
      kept.push(chunk);
    }
    i = end;
  }
  if (kept.length === 0) throw new ImageFormatError("Damaged WebP file");
  const body = concat(kept);
  const header = new Uint8Array(12);
  header.set(bytes.subarray(0, 12));
  new DataView(header.buffer).setUint32(4, 4 + body.length, true);
  return concat([header, body]);
}
