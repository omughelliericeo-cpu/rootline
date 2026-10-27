// The compliance record as a simple A4 PDF (pdf-lib, built-in Helvetica).
// Plain and printable: a details list, then numbered supplier lots and
// journey stops. New pages are added as needed; every page is numbered.
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { pdfSafeText, wrapText } from "@/lib/pdf-text";
import type { ComplianceRecord } from "./service";

const PAGE = { width: 595.28, height: 841.89, margin: 56 };
const INK = rgb(0x2b / 255, 0x2a / 255, 0x26 / 255);
const MUTED = rgb(0x6e / 255, 0x68 / 255, 0x5d / 255);

class Writer {
  private page!: PDFPage;
  private y = 0;
  readonly pages: PDFPage[] = [];

  constructor(
    private readonly pdf: PDFDocument,
    readonly regular: PDFFont,
    readonly bold: PDFFont,
  ) {
    this.newPage();
  }

  private newPage() {
    this.page = this.pdf.addPage([PAGE.width, PAGE.height]);
    this.pages.push(this.page);
    this.y = PAGE.height - PAGE.margin;
  }

  /** Writes wrapped text, starting a new page when the current one is full. */
  text(value: string, { size = 10, font = this.regular, color = INK, indent = 0, gapAfter = 4 } = {}) {
    const width = PAGE.width - PAGE.margin * 2 - indent;
    for (const line of wrapText(pdfSafeText(value), font, size, width)) {
      if (this.y - size < PAGE.margin) this.newPage();
      this.y -= size + 3;
      this.page.drawText(line, { x: PAGE.margin + indent, y: this.y, size, font, color });
    }
    this.y -= gapAfter;
  }

  space(points: number) {
    this.y -= points;
  }

  /** "Page 1 of 3" at the foot of every page. */
  numberPages(footer: string) {
    this.pages.forEach((page, index) => {
      const label = pdfSafeText(`${footer} · Page ${index + 1} of ${this.pages.length}`);
      page.drawText(label, { x: PAGE.margin, y: PAGE.margin / 2, size: 8, font: this.regular, color: MUTED });
    });
  }
}

const position = (latitude: number | null, longitude: number | null) =>
  latitude !== null && longitude !== null ? `${latitude}, ${longitude}` : "no map position";

export async function compliancePdf(record: ComplianceRecord): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(pdfSafeText(`Compliance export: ${record.title}`));
  const writer = new Writer(pdf, await pdf.embedFont(StandardFonts.Helvetica), await pdf.embedFont(StandardFonts.HelveticaBold));
  const heading = (value: string) => {
    writer.space(10);
    writer.text(value, { size: 13, font: writer.bold, gapAfter: 6 });
  };

  writer.text("Compliance export", { size: 9, color: MUTED });
  writer.text(record.title, { size: 18, font: writer.bold, gapAfter: 8 });
  for (const [label, value] of record.details) writer.text(`${label}: ${value}`, { size: 10, gapAfter: 2 });

  heading(`Supplier lots (${record.lots.length})`);
  if (record.lots.length === 0) writer.text("No supplier lots recorded.", { color: MUTED });
  record.lots.forEach((lot, index) => {
    writer.text(`${index + 1}. ${lot.supplier} (${lot.type})`, { font: writer.bold, gapAfter: 1 });
    writer.text(`Supplied: ${lot.supplied}   Lot number: ${lot.lotNumber}`, { indent: 14, gapAfter: 1 });
    writer.text(`${lot.address} (${position(lot.latitude, lot.longitude)})`, { indent: 14, color: MUTED, gapAfter: 6 });
  });

  heading(`Journey stops (${record.stops.length})`);
  if (record.stops.length === 0) writer.text("No journey stops recorded.", { color: MUTED });
  record.stops.forEach((stop, index) => {
    writer.text(`${index + 1}. ${stop.name} (${stop.type})${stop.date ? `, ${stop.date}` : ""}`, { font: writer.bold, gapAfter: 1 });
    writer.text(`${stop.address || "No address"} (${position(stop.latitude, stop.longitude)})`, { indent: 14, color: MUTED, gapAfter: 1 });
    if (stop.note) writer.text(`Note: ${stop.note}`, { indent: 14, gapAfter: 1 });
    writer.space(5);
  });

  writer.numberPages(`Rootline · ${record.title} · exported ${record.exportedAt.slice(0, 10)}`);
  return pdf.save();
}
