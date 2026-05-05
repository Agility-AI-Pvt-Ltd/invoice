import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { getSession } from "../../../../../lib/auth";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getSession();
    if (!user || !user.ownedOrgs || user.ownedOrgs.length === 0) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const organizationId = user.ownedOrgs[0].id;
    const { amount, method, notes } = await req.json();

    if (!amount || typeof amount !== "number" || amount <= 0) {
      return NextResponse.json({ error: "Valid amount is required" }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.findUnique({
        where: { id, organizationId },
        include: { payments: true },
      });

      if (!invoice) throw new Error("NOT_FOUND");
      if (invoice.status === "PAID" || invoice.status === "CANCELLED") {
        throw new Error(`INVOICE_${invoice.status}`);
      }

      const alreadyPaid = invoice.payments.reduce((s, p) => s + Number(p.amount), 0);
      const remaining = Number(invoice.total) - alreadyPaid;

      if (amount > remaining + 0.01) {
        throw new Error("OVERPAID");
      }

      const totalPaid = alreadyPaid + amount;
      const newStatus =
        totalPaid >= Number(invoice.total) - 0.01 ? "PAID" :
        totalPaid > 0 ? "PARTIALLY_PAID" : invoice.status;

      const payment = await tx.payment.create({
        data: {
          invoiceId: id,
          amount,
          method: method || null,
          notes: notes || null,
          paymentDate: new Date(),
        },
      });

      await tx.invoice.update({
        where: { id },
        data: { status: newStatus as any },
      });

      await tx.activityLog.create({
        data: {
          organizationId,
          entity: "Invoice",
          entityId: id,
          action: "PAYMENT_RECORDED",
          meta: { amount, method, newStatus },
        },
      });

      return { newStatus };
    });

    return NextResponse.json({ success: true, newStatus: result.newStatus });
  } catch (err: any) {
    if (err.message === "NOT_FOUND") return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    if (err.message.startsWith("INVOICE_")) return NextResponse.json({ error: `Cannot record payment on a ${err.message.split("_")[1].toLowerCase()} invoice` }, { status: 400 });
    if (err.message === "OVERPAID") return NextResponse.json({ error: "Amount exceeds outstanding balance" }, { status: 400 });

    console.error("[payment]", err);
    return NextResponse.json({ error: "Failed to record payment" }, { status: 500 });
  }
}
