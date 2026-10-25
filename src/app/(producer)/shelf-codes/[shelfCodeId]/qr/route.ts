// GET /shelf-codes/{id}/qr?format=png|svg|pdf: a shelf code's QR as a download. Owner only.
import { NextResponse, type NextRequest } from "next/server";
import { getShelfCode, parseQrFormat, qrDownloadResponse, shelfUrl } from "@/features/qr";
import { getOwner } from "@/lib/auth";
import { serverConfig } from "@/lib/config";

export async function GET(request: NextRequest, { params }: RouteContext<"/shelf-codes/[shelfCodeId]/qr">) {
  const owner = await getOwner();
  if (!owner) return NextResponse.redirect(new URL("/login", request.url));

  const format = parseQrFormat(request.nextUrl.searchParams.get("format"));
  if (!format) return new NextResponse("Unknown format: use png, svg or pdf", { status: 400 });

  const { shelfCodeId } = await params;
  const shelfCode = await getShelfCode(owner, shelfCodeId);
  if (!shelfCode) return new NextResponse("Shelf code not found", { status: 404 });

  return qrDownloadResponse({
    url: shelfUrl(serverConfig().APP_URL, shelfCode.code),
    name: `${owner.brandName} ${shelfCode.label}`,
    subtitle: shelfCode.label,
    format,
    inline: false,
  });
}
