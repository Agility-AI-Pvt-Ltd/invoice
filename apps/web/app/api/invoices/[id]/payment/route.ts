import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { getSession } from "@/lib/auth";
import { applyInventoryOnFullPayment } from "@/lib/domain/inventory";
import { checkAuthRateLimit } from "@/lib/ratelimit";
import { recordPaymentSchema, validateRequestBody } from "@/lib/validation-schemas";
import {
  ApiErrors,
  createErrorResponse,
  verifyOrgAccess,
  logApiAction,
} from "@/lib/api-utils";

function formatStockError(message: string) {
  const m = message.trim();
  if (m.startsWith("INSUFFICIENT_STOCK_SETUP:")) {
    return m.replace(/^INSUFFICIENT_STOCK_SETUP:\s*/, "");
  }
  if (m.startsWith("INSUFFICIENT_STOCK:")) {
    return m.replace(/^INSUFFICIENT_STOCK:\s*/, "");
  }
  return null;
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getSession();
    const organizationId = user?.ownedOrgs?.[0]?.id;

    const orgAccess = verifyOrgAccess(user, organizationId);
    if (!orgAccess.hasAccess) {
      return NextResponse.json(
        { error: orgAccess.error.message },
        { status: orgAccess.error.statusCode }
      );
    }

    const orgId = orgAccess.org.id;

    // Rate limit payment recording
    const rateLimit = await checkAuthRateLimit(`payment:${orgId}`);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: `Too many payment attempts. Try again in ${rateLimit.retryAfter}s.` },
        { status: 429 }
      );
    }

    // Validate request body
    const validation = await validateRequestBody(req, recordPaymentSchema);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { amount, method, notes } = validation.data;

    const result = await prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.findUnique({
        where: { id, organizationId: orgId },
        include: { payments: true },
      });

      if (!invoice) throw new Error("NOT_FOUND");
      if (invoice.status === "PAID" || invoice.status === "CANCELLED") {
        throw new Error(`INVOICE_${invoice.status}`);
      }

      const alreadyPaid = invoice.payments.reduce((s, p) => s + Number(p.amount), 0);
      const remaining = Number(invoice.total) - alreadyPaid;

      // Check for overpayment with 0.01 rupee tolerance
      const TOLERANCE = 0.01;
      if (amount > remaining + TOLERANCE) {
        throw new Error("OVERPAID");
      }

      const totalPaid = alreadyPaid + amount;
      const newStatus =
        totalPaid >= Number(invoice.total) - 0.01
          ? "PAID"
          : totalPaid > 0
            ? "PARTIALLY_PAID"
            : invoice.status;

      const previousStatus = invoice.status;

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
        data: { status: newStatus },
      });

      await applyInventoryOnFullPayment(tx, {
        organizationId: orgId,
        invoiceId: id,
        previousStatus,
        newStatus,
      });

      await tx.activityLog.create({
        data: {
          organizationId: orgId,
          entity: "Invoice",
          entityId: id,
          action: "PAYMENT_RECORDED",
          meta: { amount, method: method || '', newStatus, paymentId: payment.id },
        },
      });

      return { newStatus, paymentId: payment.id };
    });

    return NextResponse.json({ success: true, newStatus: result.newStatus, paymentId: result.paymentId });
  } catch (err: any) {
    const stockMsg = typeof err?.message === "string" ? formatStockError(err.message) : null;
    if (stockMsg) {
      return NextResponse.json({ error: stockMsg }, { status: 400 });
    }
    if (err.message === "NOT_FOUND") {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }
    if (err.message.startsWith("INVOICE_")) {
      const status = err.message.split("_")[1].toLowerCase();
      return NextResponse.json(
        { error: `Cannot record payment on a ${status} invoice` },
        { status: 400 }
      );
    }
    if (err.message === "OVERPAID") {
      return NextResponse.json(
        { error: "Amount exceeds outstanding balance" },
        { status: 400 }
      );
    }

    return createErrorResponse(err, "POST /api/invoices/[id]/payment");
  }
}
