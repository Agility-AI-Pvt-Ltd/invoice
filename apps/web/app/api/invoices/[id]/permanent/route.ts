import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { getSession } from "@/lib/auth";

// DELETE /api/invoices/[id]/permanent — hard-delete invoice row; cascades line items & payments etc.
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const user = await getSession();
    const organizationId = user?.ownedOrgs?.[0]?.id;
    if (!organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let confirmInvoiceNumber = "";
    try {
      const body = await req.json().catch(() => null);
      confirmInvoiceNumber =
        typeof body?.confirmInvoiceNumber === "string"
          ? body.confirmInvoiceNumber.trim()
          : "";
    } catch {
      confirmInvoiceNumber = "";
    }

    const existing = await prisma.invoice.findUnique({
      where: { id, organizationId },
      include: { payments: { select: { id: true } } },
    });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (
      existing.status === "PAID" ||
      existing.status === "PARTIALLY_PAID" ||
      existing.payments.length > 0
    ) {
      return NextResponse.json(
        {
          error:
            "Cannot permanently delete an invoice that has received payments.",
        },
        { status: 400 },
      );
    }

    const latestInvoice = await prisma.invoice.findFirst({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      select: { id: true },
    });

    if (latestInvoice?.id !== id) {
      return NextResponse.json(
        {
          error:
            "Only the most recently created invoice can be permanently deleted to maintain sequential numbering. Please 'Cancel' this invoice instead.",
        },
        { status: 400 },
      );
    }

    if (!confirmInvoiceNumber || confirmInvoiceNumber !== existing.invoiceNumber) {
      return NextResponse.json(
        {
          error:
            "Invoice number does not match. Type the exact invoice number to confirm deletion.",
        },
        { status: 400 },
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.activityLog.deleteMany({
        where: { organizationId, entity: "Invoice", entityId: id },
      });
      await tx.invoice.delete({
        where: { id },
      });
    });

    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error("[invoices/permanent-delete]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
