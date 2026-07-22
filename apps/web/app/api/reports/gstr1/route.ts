import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { getSession } from "../../../../lib/auth";
import {
  buildGstrCsv,
  buildGstrReport,
  parseGstrPeriod,
} from "@/lib/gst-report";

/**
 * GSTR-1 Export API
 *
 * GET /api/reports/gstr1?month=2024-03              → JSON (monthly)
 * GET /api/reports/gstr1?quarter=2024-Q1            → JSON (quarterly)
 * GET /api/reports/gstr1?month=2024-03&format=csv   → CSV download
 *
 * CSV includes: Summary, B2B, B2CL, B2CS, B2C detail, HSN summary,
 * line-item detail, and documents issued — suitable for monthly/quarterly filing.
 */
export async function GET(req: Request) {
  const user = await getSession();
  const organizationId = user?.ownedOrgs?.[0]?.id;
  if (!organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const format = searchParams.get("format") || "json";
  const periodResult = parseGstrPeriod({
    month: searchParams.get("month"),
    quarter: searchParams.get("quarter"),
  });

  if ("error" in periodResult) {
    return NextResponse.json({ error: periodResult.error }, { status: 400 });
  }

  const period = periodResult;

  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
  });
  if (!organization) {
    return NextResponse.json({ error: "Organization not found" }, { status: 404 });
  }

  const invoices = await prisma.invoice.findMany({
    where: {
      organizationId,
      issueDate: { gte: period.from, lte: period.to },
      status: { notIn: ["DRAFT", "CANCELLED"] },
    },
    include: {
      customer: true,
      items: true,
    },
    orderBy: { issueDate: "asc" },
  });

  const report = buildGstrReport(invoices, organization, period);

  if (format === "csv") {
    const csvContent = buildGstrCsv(report);
    const filePeriod = period.label.replace("-", "_");
    return new Response(csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="GSTR1_${organization.gstin || "export"}_${filePeriod}.csv"`,
      },
    });
  }

  return NextResponse.json({
    summary: report.summary,
    b2b: report.b2b,
    b2cl: report.b2cl,
    b2cs: report.b2cs,
    b2c: report.b2c_detail,
    hsn: report.hsn,
    documents: report.documents,
  });
}
