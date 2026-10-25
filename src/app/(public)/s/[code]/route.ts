// GET /s/{code}: a reusable shelf QR code. Sends the shopper on to the story
// of the batch the producer has pointed it at (marked as a shelf scan).
import { NextResponse, type NextRequest } from "next/server";
import { batchCodeForShelfCode } from "@/features/story-page";

export async function GET(request: NextRequest, { params }: RouteContext<"/s/[code]">) {
  const { code } = await params;
  const batchCode = await batchCodeForShelfCode(code);
  if (!batchCode) {
    return new NextResponse("This shelf code is not pointing at a batch right now. Please ask in store.", {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
  // 307 (temporary): the shelf code will point at a different batch later, so browsers must not cache it.
  return NextResponse.redirect(new URL(`/b/${batchCode}?via=shelf`, request.url), 307);
}
