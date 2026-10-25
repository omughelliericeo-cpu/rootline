// GET /certificates/{id}/file: opens a certificate file for its owner.
// Files are private; this redirects to a signed link that expires in 5 minutes.
import { NextResponse, type NextRequest } from "next/server";
import { certificateFileUrl } from "@/features/certificates";
import { getOwner } from "@/lib/auth";

export async function GET(request: NextRequest, { params }: RouteContext<"/certificates/[certificateId]/file">) {
  const owner = await getOwner();
  if (!owner) return NextResponse.redirect(new URL("/login", request.url));

  const { certificateId } = await params;
  const url = await certificateFileUrl(owner, certificateId);
  if (!url) return new NextResponse("Certificate not found", { status: 404 });
  return NextResponse.redirect(url);
}
