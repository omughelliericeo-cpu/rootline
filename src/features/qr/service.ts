// QR rules: the public links codes point to, download file names, and the
// A4 sticker sheet layout. Pure functions, unit tested.

export function batchUrl(appUrl: string, code: string): string {
  return `${appUrl.replace(/\/+$/, "")}/b/${code}`;
}

export function shelfUrl(appUrl: string, code: string): string {
  return `${appUrl.replace(/\/+$/, "")}/s/${code}`;
}

/** "Hazy Pale Ale, Brew 214" -> "hazy-pale-ale-brew-214.svg" */
export function downloadFileName(name: string, extension: string): string {
  const slug = name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return `${slug || "qr-code"}.${extension}`;
}

export type QrFormat = "svg" | "png" | "pdf";

export function parseQrFormat(value: string | null): QrFormat | null {
  return value === "svg" || value === "png" || value === "pdf" ? value : null;
}

/** Millimetres to PDF points. */
const mm = (value: number) => (value * 72) / 25.4;

/**
 * Avery L7160 / standard 21-up A4 labels: 3 columns x 7 rows of 63.5 x 38.1 mm.
 * Widely sold, so producers can print straight onto label sheets.
 */
export const STICKER_SHEET = {
  pageWidth: mm(210),
  pageHeight: mm(297),
  columns: 3,
  rows: 7,
  labelWidth: mm(63.5),
  labelHeight: mm(38.1),
  marginLeft: mm(7.2),
  marginTop: mm(15.15),
  columnPitch: mm(66.04),
  rowPitch: mm(38.1),
};

export type StickerBox = { x: number; y: number; width: number; height: number };

/** Label positions in PDF points, from the bottom-left corner (PDF's origin), top row first. */
export function stickerPositions(sheet = STICKER_SHEET): StickerBox[] {
  const boxes: StickerBox[] = [];
  for (let row = 0; row < sheet.rows; row++) {
    for (let column = 0; column < sheet.columns; column++) {
      boxes.push({
        x: sheet.marginLeft + column * sheet.columnPitch,
        y: sheet.pageHeight - sheet.marginTop - (row + 1) * sheet.rowPitch,
        width: sheet.labelWidth,
        height: sheet.labelHeight,
      });
    }
  }
  return boxes;
}

/**
 * The built-in PDF fonts only cover Western European characters; anything
 * else (e.g. emoji) is replaced so the PDF never fails to build.
 */
export function pdfSafeText(text: string): string {
  return text.replace(/[^\x20-\x7E -ÿ]/g, "?");
}
