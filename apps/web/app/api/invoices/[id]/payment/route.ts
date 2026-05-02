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
    if (!user || user.ownedOrgs.length === 0) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const organizationId = user.ownedOrgs[0].id;
    const { amount, method, notes } = await req.json();

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Valid amount is required" }, { status: 400 });
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id, organizationId },
      include: { payments: true },
    });
    if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

    const totalPaid = invoice.payments.reduce((s, p) => s + p.amount, 0) + amount;

    const newStatus =
      totalPaid >= invoice.total ? "PAID" :
      totalPaid > 0 ? "PARTIALLY_PAID" : invoice.status;

    await prisma.$transaction([
      prisma.payment.create({
        data: {
          invoiceId: params.id,
          amount,
          method: method || null,
          notes: notes || null,
          paymentDate: new Date(),
        },
      }),
      prisma.invoice.update({
        where: { id: params.id },
        data: { status: newStatus as any },
      }),
    ]);

    return NextResponse.json({ success: true, newStatus });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to record payment" }, { status: 500 });
  }
}
