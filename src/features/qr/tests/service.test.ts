// Tests for QR links, file names and the A4 sticker sheet layout.
import { describe, expect, it } from "vitest";
import { STICKER_SHEET, batchUrl, downloadFileName, parseQrFormat, pdfSafeText, shelfUrl, stickerPositions } from "../service";

describe("links", () => {
  it("builds batch and shelf links without double slashes", () => {
    expect(batchUrl("https://rootline.app/", "k7m2q9xd")).toBe("https://rootline.app/b/k7m2q9xd");
    expect(shelfUrl("https://rootline.app", "k7m2q9xd")).toBe("https://rootline.app/s/k7m2q9xd");
  });
});

describe("downloadFileName", () => {
  it("makes a tidy file name", () => {
    expect(downloadFileName("Hazy Pale Ale, Brew 214", "svg")).toBe("hazy-pale-ale-brew-214.svg");
    expect(downloadFileName("Café Crème", "png")).toBe("cafe-creme.png");
    expect(downloadFileName("!!!", "pdf")).toBe("qr-code.pdf");
  });
});

describe("parseQrFormat", () => {
  it("accepts only png, svg and pdf", () => {
    expect(parseQrFormat("png")).toBe("png");
    expect(parseQrFormat("gif")).toBeNull();
    expect(parseQrFormat(null)).toBeNull();
  });
});

describe("sticker sheet", () => {
  const boxes = stickerPositions();

  it("has 21 labels, 3 across and 7 down", () => {
    expect(boxes).toHaveLength(21);
    expect(new Set(boxes.map((box) => Math.round(box.x))).size).toBe(3);
    expect(new Set(boxes.map((box) => Math.round(box.y))).size).toBe(7);
  });

  it("keeps every label on the A4 page", () => {
    for (const box of boxes) {
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.y).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(STICKER_SHEET.pageWidth);
      expect(box.y + box.height).toBeLessThanOrEqual(STICKER_SHEET.pageHeight);
    }
  });

  it("starts at the top-left (PDF coordinates count up from the bottom)", () => {
    expect(boxes[0]!.y).toBeGreaterThan(boxes[20]!.y);
    expect(boxes[0]!.x).toBeLessThan(boxes[2]!.x);
  });

  it("replaces characters the PDF fonts cannot draw", () => {
    expect(pdfSafeText("Crème brûlée 🍺")).toBe("Crème brûlée ??");
  });
});
