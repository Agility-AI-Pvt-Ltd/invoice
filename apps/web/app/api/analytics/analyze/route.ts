import { NextRequest, NextResponse } from "next/server";
import { getSessionOrThrow, getOrgOrThrow } from "@/lib/auth";
import { prisma } from "@repo/db";

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionOrThrow();
    const org = getOrgOrThrow(user);

    const body = await req.json();
    const { invoiceId } = body;

    if (!invoiceId) {
        return NextResponse.json({ error: "Invoice ID required" }, { status: 400 });
    }

    const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId, organizationId: org.id }
    });

    if (!invoice) {
        return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const payload = {
        organization_id: org.id,
        invoice_id: invoice.id,
        amount: Number(invoice.total)
    };

    const res = await fetch(`http://localhost:8000/api/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Analytics service failed" }, { status: res.status });
    }
    const data = await res.json();

    // Check if there is a custom threshold set for the org
    const dbOrg = await prisma.organization.findUnique({
      where: { id: org.id },
      select: { customAnomalyThreshold: true }
    });

    if (dbOrg?.customAnomalyThreshold !== null && dbOrg?.customAnomalyThreshold !== undefined) {
      // Override the python service result with the custom threshold
      data.is_anomaly = payload.amount > dbOrg.customAnomalyThreshold;
      data.reason = data.is_anomaly ? `Amount exceeds your custom limit of ${dbOrg.customAnomalyThreshold}` : "Within normal limits";
    }

    // Update the invoice with anomaly result
    await prisma.invoice.update({
        where: { id: invoiceId },
        data: {
            isAnomaly: data.is_anomaly,
            anomalyReason: data.reason,
            anomalyScore: data.score
        }
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error calling analyze service:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
