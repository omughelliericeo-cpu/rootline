// GET /auth/confirm: the link in the sign-up confirmation email. Logs the
// producer in and sends them to their dashboard.
import { NextResponse, type NextRequest } from "next/server";
import { confirmEmailFromLink } from "@/features/auth";

export async function GET(request: NextRequest) {
  const confirmed = await confirmEmailFromLink(request.nextUrl.searchParams);
  const destination = confirmed ? "/dashboard" : "/login?error=confirm";
  return NextResponse.redirect(new URL(destination, request.url));
}
