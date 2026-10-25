// Builds the HTTP response for a QR download (SVG, PNG or sticker sheet PDF).
import "server-only";
import { NextResponse } from "next/server";
import { downloadFileName, type QrFormat } from "../service";
import { qrPng, qrSvg, stickerSheetPdf } from "./render";

type DownloadRequest = { url: string; name: string; subtitle: string; format: QrFormat; inline: boolean };

const CALL_TO_ACTION = "Scan to see where it came from";

export async function qrDownloadResponse({ url, name, subtitle, format, inline }: DownloadRequest): Promise<NextResponse> {
  const fileName = downloadFileName(name, format);
  const disposition = `${inline ? "inline" : "attachment"}; filename="${fileName}"`;
  const headers = { "Content-Disposition": disposition, "Cache-Control": "private, max-age=300" };

  if (format === "svg") {
    return new NextResponse(await qrSvg(url), { headers: { ...headers, "Content-Type": "image/svg+xml" } });
  }
  if (format === "png") {
    return new NextResponse(new Uint8Array(await qrPng(url)), { headers: { ...headers, "Content-Type": "image/png" } });
  }
  const pdf = await stickerSheetPdf(url, { title: name, subtitle, callToAction: CALL_TO_ACTION });
  return new NextResponse(new Uint8Array(pdf), { headers: { ...headers, "Content-Type": "application/pdf" } });
}
