// JPEG: drops every APP1–APP15 segment (EXIF, XMP, maker notes; APP2 colour
// profiles are kept) and comments, plus anything stored after the image.
// The "which way up" tag (EXIF orientation) is put back on its own, so phone
// photos do not turn sideways; it carries nothing personal.
import { ImageFormatError, concat, startsWith } from "./bytes";

const SOI = 0xd8;
const EOI = 0xd9;
const SOS = 0xda;
const APP0 = 0xe0;
const APP1 = 0xe1;
const APP2 = 0xe2;
const APP15 = 0xef;
const COMMENT = 0xfe;

export function stripJpeg(bytes: Uint8Array): Uint8Array<ArrayBuffer> {
  if (bytes[0] !== 0xff || bytes[1] !== SOI) throw new ImageFormatError("Not a JPEG file");
  const kept: Uint8Array[] = [];
  let orientation = 1;
  let i = 2;

  while (i + 1 < bytes.length) {
    if (bytes[i] !== 0xff) throw new ImageFormatError("Damaged JPEG file");
    const marker = bytes[i + 1]!;
    if (marker === 0xff) {
      i += 1; // fill byte
      continue;
    }
    if (marker === SOS) {
      // From here on it is image data, up to the end-of-image marker.
      const head = kept[0]?.[1] === APP0 ? [kept.shift()!] : [];
      const turned = orientation === 1 ? [] : [orientationSegment(orientation)];
      return concat([bytes.subarray(0, 2), ...head, ...turned, ...kept, bytes.subarray(i, endOfImage(bytes, i))]);
    }
    if (marker === EOI) break;
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      i += 2; // markers without a length
      continue;
    }
    const length = ((bytes[i + 2] ?? 0) << 8) | (bytes[i + 3] ?? 0);
    if (length < 2 || i + 2 + length > bytes.length) throw new ImageFormatError("Damaged JPEG file");
    const segment = bytes.subarray(i, i + 2 + length);
    const payload = segment.subarray(4);

    if (marker === APP1 && startsWith(payload, "Exif\0\0")) orientation = readOrientation(payload.subarray(6)) ?? orientation;
    const isMetadata = (marker >= APP1 && marker <= APP15 && !(marker === APP2 && startsWith(payload, "ICC_PROFILE\0"))) || marker === COMMENT;
    if (!isMetadata) kept.push(segment);
    i += 2 + length;
  }
  throw new ImageFormatError("Damaged JPEG file");
}

/** Index just after the first end-of-image marker (inside image data 0xFF is always followed by 0x00 or a restart marker). */
function endOfImage(bytes: Uint8Array, from: number): number {
  for (let j = from + 2; j + 1 < bytes.length; j += 1) {
    if (bytes[j] === 0xff && bytes[j + 1] === EOI) return j + 2;
  }
  return bytes.length;
}

/** Reads the orientation (1–8) from an EXIF block (TIFF layout), or null. */
export function readOrientation(tiff: Uint8Array): number | null {
  if (tiff.length < 8) return null;
  const little = tiff[0] === 0x49 && tiff[1] === 0x49;
  if (!little && !(tiff[0] === 0x4d && tiff[1] === 0x4d)) return null;
  const view = new DataView(tiff.buffer, tiff.byteOffset, tiff.byteLength);
  const ifd = view.getUint32(4, little);
  if (ifd + 2 > tiff.length) return null;
  const count = view.getUint16(ifd, little);
  for (let n = 0; n < count; n += 1) {
    const entry = ifd + 2 + n * 12;
    if (entry + 12 > tiff.length) return null;
    if (view.getUint16(entry, little) === 0x0112) {
      const value = view.getUint16(entry + 8, little);
      return value >= 1 && value <= 8 ? value : null;
    }
  }
  return null;
}

/** A minimal EXIF segment holding only the orientation tag. */
export function orientationSegment(orientation: number): Uint8Array {
  return Uint8Array.from([
    0xff, APP1, 0x00, 0x22, // marker, length 34
    0x45, 0x78, 0x69, 0x66, 0x00, 0x00, // "Exif\0\0"
    0x4d, 0x4d, 0x00, 0x2a, 0x00, 0x00, 0x00, 0x08, // big-endian TIFF, first IFD at 8
    0x00, 0x01, // one entry
    0x01, 0x12, 0x00, 0x03, 0x00, 0x00, 0x00, 0x01, 0x00, orientation, 0x00, 0x00, // Orientation, SHORT, 1 value
    0x00, 0x00, 0x00, 0x00, // no next IFD
  ]);
}
