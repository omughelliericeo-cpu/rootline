// Text helpers for PDFs made with pdf-lib (QR sticker sheets, compliance
// exports). Pure functions, unit tested.

/**
 * The built-in PDF fonts only cover Western European characters; anything
 * else (e.g. emoji) is replaced so the PDF never fails to build.
 */
export function pdfSafeText(text: string): string {
  return text.replace(/[^\x20-\x7E -ÿ]/g, "?");
}

type Font = { widthOfTextAtSize: (text: string, size: number) => number };

/** Splits text into lines that fit `maxWidth` points at `size`. Words longer than a line stay whole. */
export function wrapText(text: string, font: Font, size: number, maxWidth: number): string[] {
  const lines: string[] = [];
  let current = "";
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const candidate = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth || !current) current = candidate;
    else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}
