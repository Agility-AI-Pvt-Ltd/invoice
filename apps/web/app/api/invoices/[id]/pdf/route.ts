import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { getSession } from "@/lib/auth";
import { renderToBuffer } from "@react-pdf/renderer";
import { buildPDF } from "@/lib/pdf-templates";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const user = await getSession();
    const organizationId = user?.ownedOrgs?.[0]?.id;

    if (!organizationId || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
    const allowedTemplates = ["modern", "classic", "minimal"];
    const requestedTemplate = searchParams.get("template");
    const template =
      requestedTemplate && allowedTemplates.includes(requestedTemplate)
        ? requestedTemplate
        : (invoice.organization as any).defaultTemplate ?? "modern";

    if (!allowedTemplates.includes(template)) {
      return NextResponse.json(
        { error: "Invalid template specified" },
        { status: 400 }
      );
    }

    const pdfDoc = buildPDF(invoice as any, template);
    const buffer = await renderToBuffer(pdfDoc);

    // Set proper caching headers
    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${invoice.invoiceNumber}.pdf"`,
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
      },
    });
  } catch (err: any) {
    console.error("PDF generation error:", {
      message: err?.message,
      stack: err?.stack,
    });
    return NextResponse.json(
      { error: "PDF generation failed" },
      { status: 500 }
    );
  }
}
