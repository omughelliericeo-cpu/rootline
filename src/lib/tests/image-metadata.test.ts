// Tests that hidden photo metadata (EXIF/GPS, XMP, comments, text) is removed
// while the image itself and its orientation survive.
import { describe, expect, it } from "vitest";
import { ImageFormatError, stripImageMetadata } from "../image-metadata";
import { orientationSegment, readOrientation } from "../image-metadata/jpeg";

const text = (value: string) => Array.from(value, (char) => char.charCodeAt(0));
const has = (bytes: Uint8Array, value: string) => Buffer.from(bytes).includes(Buffer.from(value, "latin1"));
const segment = (marker: number, payload: number[]) => [0xff, marker, (payload.length + 2) >> 8, (payload.length + 2) & 0xff, ...payload];

// A little-endian EXIF block: orientation 6 (turned 90°) plus a fake GPS note.
const exif = [
  ...text("Exif\0\0"),
  ...[0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00], // "II", 42, IFD at 8
  ...[0x01, 0x00], // one entry
  ...[0x12, 0x01, 0x03, 0x00, 0x01, 0x00, 0x00, 0x00, 0x06, 0x00, 0x00, 0x00],
  ...[0x00, 0x00, 0x00, 0x00],
  ...text("GPS 49.2838 -122.8317"),
];
const scan = [0xff, 0xda, 0x00, 0x04, 0x01, 0x02, 0x11, 0xff, 0x00, 0x22, 0xff, 0xd0, 0x33];

function jpeg() {
  return Uint8Array.from([
    0xff, 0xd8,
    ...segment(0xe0, text("JFIF\0\x01\x01\0\0\x01\0\x01\0\0")),
    ...segment(0xe1, exif),
    ...segment(0xe1, text("http://ns.adobe.com/xap/1.0/\0<xmp>secret place</xmp>")),
    ...segment(0xe2, text("ICC_PROFILE\0colours")),
    ...segment(0xfe, text("home address comment")),
    ...segment(0xdb, [0x00, 0x01, 0x02]),
    ...scan,
    0xff, 0xd9,
    ...text("TRAILER with GPS"),
  ]);
}

describe("JPEG", () => {
  const out = stripImageMetadata(jpeg(), "image/jpeg");

  it("removes EXIF, XMP, comments and anything after the image", () => {
    expect(has(out, "GPS")).toBe(false);
    expect(has(out, "secret place")).toBe(false);
    expect(has(out, "home address")).toBe(false);
    expect(has(out, "TRAILER")).toBe(false);
  });

  it("keeps the image data, colour profile and JFIF header", () => {
    expect(has(out, "ICC_PROFILE")).toBe(true);
    expect(has(out, "JFIF")).toBe(true);
    expect(Buffer.from(out).includes(Buffer.from([...scan, 0xff, 0xd9]))).toBe(true);
    expect(Array.from(out.subarray(-2))).toEqual([0xff, 0xd9]);
  });

  it("keeps which way up the photo is, and nothing else from EXIF", () => {
    const exifStart = Buffer.from(out).indexOf(Buffer.from(text("Exif\0\0")));
    expect(readOrientation(out.subarray(exifStart + 6))).toBe(6);
    expect(Array.from(out.subarray(exifStart - 4, exifStart - 4 + 36))).toEqual(Array.from(orientationSegment(6)));
  });

  it("adds no orientation segment for upright photos", () => {
    const upright = Uint8Array.from([0xff, 0xd8, ...segment(0xdb, [0x00]), ...scan, 0xff, 0xd9]);
    expect(stripImageMetadata(upright, "image/jpeg")).toEqual(upright);
  });
});

function pngChunk(type: string, data: number[]) {
  const length = [0, 0, data.length >> 8, data.length & 0xff];
  return [...length, ...text(type), ...data, 0xaa, 0xbb, 0xcc, 0xdd];
}

describe("PNG", () => {
  const png = Uint8Array.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
    ...pngChunk("IHDR", [0, 0, 0, 1, 0, 0, 0, 1, 8, 6, 0, 0, 0]),
    ...pngChunk("eXIf", text("GPS 49.28")),
    ...pngChunk("tEXt", text("Comment\0my house")),
    ...pngChunk("IDAT", [1, 2, 3]),
    ...pngChunk("IEND", []),
  ]);

  it("keeps the image chunks and drops EXIF and text", () => {
    const out = stripImageMetadata(png, "image/png");
    expect(has(out, "GPS")).toBe(false);
    expect(has(out, "my house")).toBe(false);
    expect(has(out, "IHDR") && has(out, "IDAT") && has(out, "IEND")).toBe(true);
    expect(out.length).toBe(png.length - (12 + 9) - (12 + 16));
  });
});

function webpChunk(type: string, data: number[]) {
  const padded = data.length % 2 ? [...data, 0] : data;
  return [...text(type), data.length & 0xff, data.length >> 8, 0, 0, ...padded];
}

describe("WebP", () => {
  const body = [
    ...text("WEBP"),
    ...webpChunk("VP8X", [0x2c, 0, 0, 0, 0, 0, 0, 0, 0, 0]), // ICC + EXIF + XMP flags
    ...webpChunk("ICCP", text("colours")),
    ...webpChunk("VP8 ", [9, 8, 7, 6]),
    ...webpChunk("EXIF", text("GPS 49.28")),
    ...webpChunk("XMP ", text("<x>place</x>")),
  ];
  const webp = Uint8Array.from([...text("RIFF"), body.length & 0xff, body.length >> 8, 0, 0, ...body]);

  it("drops EXIF and XMP, clears their flags and fixes the file size", () => {
    const out = stripImageMetadata(webp, "image/webp");
    expect(has(out, "GPS") || has(out, "place")).toBe(false);
    expect(has(out, "VP8 ") && has(out, "ICCP")).toBe(true);
    expect(out[20]).toBe(0x20); // only the colour-profile flag is left
    expect(new DataView(out.buffer).getUint32(4, true)).toBe(out.length - 8);
  });
});

describe("file type check", () => {
  it("refuses a file whose bytes are not the claimed type", () => {
    const png = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    expect(() => stripImageMetadata(png, "image/jpeg")).toThrow(ImageFormatError);
    expect(() => stripImageMetadata(Uint8Array.from(text("<svg>")), "image/png")).toThrow(ImageFormatError);
    expect(() => stripImageMetadata(jpeg(), "image/webp")).toThrow(ImageFormatError);
  });
});
