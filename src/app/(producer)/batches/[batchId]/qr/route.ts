// GET /batches/{id}/qr?format=png|svg|pdf: the batch's QR code as a download
// (PDF = A4 sticker sheet). Owner only.
import { NextResponse, type NextRequest } from "next/server";
import { batchName, getBatch } from "@/features/batches";
import { getTemplate } from "@/features/industries";
import { batchUrl, parseQrFormat, qrDownloadResponse } from "@/features/qr";
import { getOwner } from "@/lib/auth";
import { serverConfig } from "@/lib/config";

export async function GET(request: NextRequest, { params }: RouteContext<"/batches/[batchId]/qr">) {
  const owner = await getOwner();
  if (!owner) return NextResponse.redirect(new URL("/login", request.url));

  const format = parseQrFormat(request.nextUrl.searchParams.get("format"));
  if (!format) return new NextResponse("Unknown format: use png, svg or pdf", { status: 400 });

  const { batchId } = await params;
  const batch = await getBatch(owner, batchId);
  if (!batch) return new NextResponse("Batch not found", { status: 404 });

  const template = getTemplate(owner.industry);
  return qrDownloadResponse({
    url: batchUrl(serverConfig().APP_URL, batch.code),
    name: batchName(batch.productName, template.labels.batch, batch.number),
    subtitle: owner.brandName,
    format,
    inline: false,
  });
}
