import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { getSession } from "../../../../../lib/auth";
import { renderToBuffer } from "@react-pdf/renderer";
import { buildPDF } from "../../../../../lib/pdf-templates";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const user = await getSession();
    if (!user || !user.ownedOrgs || user.ownedOrgs.length === 0) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const organizationId = user.ownedOrgs[0].id;

    const invoice = await prisma.invoice.findUnique({
      where: { id, organizationId },
      include: {
        customer: true,
        items: true,
        organization: true,
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Query param overrides org default (user picked in UI)
    const template = searchParams.get("template") ?? (invoice.organization as any).defaultTemplate ?? "modern";

    const pdfDoc = buildPDF(invoice as any, template);
    const buffer = await renderToBuffer(pdfDoc);

    return new Response(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${invoice.invoiceNumber}.pdf"`,
      },
    });
  } catch (err: any) {
    console.error("PDF generation error:", err);
    return NextResponse.json({ error: "PDF generation failed" }, { status: 500 });
  }
}
