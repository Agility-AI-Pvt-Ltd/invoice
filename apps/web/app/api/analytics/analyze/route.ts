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

// Return the invoice details without anomaly processing
  return NextResponse.json({ invoice });
  } catch (error) {
    console.error("Error calling analyze service:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
