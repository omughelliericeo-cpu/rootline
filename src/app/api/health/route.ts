// GET /api/health: checks the database, file storage and email provider and
// reports each one's status. Returns 503 only when the database is down.
import { NextResponse } from "next/server";
import { checkDatabase, checkEmail, checkStorage } from "@/lib/health/checks";
import { overallStatus } from "@/lib/health/summary";
import { logger } from "@/lib/logger";
import { getRequestId } from "@/lib/request-context";

export async function GET() {
  const requestId = await getRequestId();
  const [database, storage, email] = await Promise.all([checkDatabase(), checkStorage(), checkEmail()]);
  const checks = { database, storage, email };
  const status = overallStatus(checks);

  const log = status === "ok" ? logger.info : logger.warn;
  log("health checked", { feature: "health", action: "check", requestId, status, checks });

  return NextResponse.json(
    { status, requestId, checkedAt: new Date().toISOString(), checks },
    { status: status === "down" ? 503 : 200, headers: { "Cache-Control": "no-store" } },
  );
}
