// GET /b/{code}/certificates/{id}: the certificate behind a badge. Opens only
// while the certificate is valid and belongs to this published batch's story.
import { NextResponse, type NextRequest } from "next/server";
import { storyCertificateUrl } from "@/features/story-page";

export async function GET(_request: NextRequest, { params }: RouteContext<"/b/[code]/certificates/[certificateId]">) {
  const { code, certificateId } = await params;
  const url = await storyCertificateUrl(code, certificateId);
  if (!url) return new NextResponse("This certificate is not available.", { status: 404 });
  return NextResponse.redirect(url);
}
