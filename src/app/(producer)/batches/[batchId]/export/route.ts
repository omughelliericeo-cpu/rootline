// GET /batches/{id}/export?format=csv|pdf: the batch's compliance record as a
// download (product, dates, supplier lots, suppliers, journey stops). Owner only.
import { NextResponse, type NextRequest } from "next/server";
import { compliancePdf, loadComplianceRecord, toCsv } from "@/features/compliance";
import { downloadFileName } from "@/features/qr";
import { getOwner } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { getRequestId } from "@/lib/request-context";

export async function GET(request: NextRequest, { params }: RouteContext<"/batches/[batchId]/export">) {
  const owner = await getOwner();
  if (!owner) return NextResponse.redirect(new URL("/login", request.url));

  const format = request.nextUrl.searchParams.get("format");
  if (format !== "csv" && format !== "pdf") return new NextResponse("Unknown format: use csv or pdf", { status: 400 });

  const { batchId } = await params;
  const record = await loadComplianceRecord(owner, batchId, new Date());
  if (!record) return new NextResponse("Batch not found", { status: 404 });

  logger.info("compliance export", { feature: "compliance", action: "export", requestId: await getRequestId(), brandId: owner.brandId, batchId, format });
  const headers = {
    "Content-Disposition": `attachment; filename="${downloadFileName(`${record.title} compliance`, format)}"`,
    "Cache-Control": "no-store",
  };
  if (format === "csv") {
    return new NextResponse(toCsv(record), { headers: { ...headers, "Content-Type": "text/csv; charset=utf-8" } });
  }
  return new NextResponse(new Uint8Array(await compliancePdf(record)), { headers: { ...headers, "Content-Type": "application/pdf" } });
}
