// Draws QR codes as SVG or PNG (the "qrcode" package) and the A4 sticker
// sheet PDF (pdf-lib). Dark ink on white, quiet zone included, medium error
// correction: reliable to scan from a phone even when slightly scuffed.
import "server-only";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import QRCode from "qrcode";
import { pdfSafeText, wrapText } from "@/lib/pdf-text";
import { STICKER_SHEET, stickerPositions } from "../service";

const QR_OPTIONS = { errorCorrectionLevel: "M" as const, margin: 2, color: { dark: "#2B2A26", light: "#FFFFFF" } };

export function qrSvg(url: string): Promise<string> {
  return QRCode.toString(url, { ...QR_OPTIONS, type: "svg" });
}

/** 1024 px wide: sharp enough for print at label and poster sizes. */
export function qrPng(url: string, width = 1024): Promise<Buffer> {
  return QRCode.toBuffer(url, { ...QR_OPTIONS, type: "png", width });
}

type StickerText = { title: string; subtitle: string; callToAction: string };

/** One A4 page of 21 identical stickers: QR on the left, words on the right. */
export async function stickerSheetPdf(url: string, text: StickerText): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(pdfSafeText(text.title));
  const page = pdf.addPage([STICKER_SHEET.pageWidth, STICKER_SHEET.pageHeight]);
  const [qr, bold, regular] = await Promise.all([
    pdf.embedPng(await qrPng(url, 600)),
    pdf.embedFont(StandardFonts.HelveticaBold),
    pdf.embedFont(StandardFonts.Helvetica),
  ]);
  const ink = rgb(0x2b / 255, 0x2a / 255, 0x26 / 255);
  const muted = rgb(0x6e / 255, 0x68 / 255, 0x5d / 255);

  for (const box of stickerPositions()) {
    const padding = 6;
    const qrSize = box.height - padding * 2;
    page.drawImage(qr, { x: box.x + padding, y: box.y + padding, width: qrSize, height: qrSize });

    const textX = box.x + padding * 2 + qrSize;
    const textWidth = box.width - qrSize - padding * 3;
    const lines = [
      { value: text.title, font: bold, size: 8, color: ink },
      { value: text.subtitle, font: regular, size: 7, color: ink },
      { value: text.callToAction, font: regular, size: 6.5, color: muted },
    ];
    let y = box.y + box.height - padding - 9;
    for (const line of lines) {
      for (const wrapped of wrapText(pdfSafeText(line.value), line.font, line.size, textWidth).slice(0, 2)) {
        page.drawText(wrapped, { x: textX, y, size: line.size, font: line.font, color: line.color });
        y -= line.size + 2.5;
      }
      y -= 2;
    }
  }
  return pdf.save();
}
