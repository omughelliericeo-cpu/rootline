// GET /auth/confirm: the links in Supabase's emails. A sign-up confirmation logs
// the producer in and goes to the dashboard; a password reset link goes to
// "Choose a new password".
import { NextResponse, type NextRequest } from "next/server";
import { confirmEmailFromLink } from "@/features/auth";

export async function GET(request: NextRequest) {
  const outcome = await confirmEmailFromLink(request.nextUrl.searchParams);
  const response = NextResponse.redirect(new URL(outcome.destination, request.url));
  if (outcome.ok && outcome.cookie) response.cookies.set(outcome.cookie);
  return response;
}
