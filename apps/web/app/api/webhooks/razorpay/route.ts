import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { createHmac } from "crypto";

/**
 * Razorpay Webhook Handler
 * 
 * Configure in Razorpay Dashboard → Settings → Webhooks:
 *   URL: https://yourdomain.com/api/webhooks/razorpay
 *   Events: payment_link.paid, payment.captured
 * 
 * The webhook secret is set per-organization via Settings → Razorpay.
 * We verify the HMAC signature before processing any event.
 */
export async function POST(req: Request) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-razorpay-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { event, payload: eventPayload } = payload;

  // ── Handle payment_link.paid ──────────────────────────────────────
  if (event === "payment_link.paid") {
    const paymentLinkId: string = eventPayload?.payment_link?.entity?.id;
    const razorpayPaymentId: string = eventPayload?.payment?.entity?.id;
    const amount: number = (eventPayload?.payment?.entity?.amount ?? 0) / 100; // paise → rupees

    if (!paymentLinkId) {
      return NextResponse.json({ error: "Missing payment_link id" }, { status: 400 });
    }

    // Find our PaymentLink record by externalId
    const pl = await prisma.paymentLink.findFirst({
      where: { externalId: paymentLinkId },
      include: { invoice: { include: { organization: true } } },
    });

    if (!pl) {
      // Could be from another system — silently OK
      return NextResponse.json({ received: true });
    }

    // Verify HMAC against the org's webhook secret
    const orgId = pl.invoice.organizationId;
    const gatewayCfg = await prisma.paymentGatewayConfig.findUnique({
      where: { organizationId_provider: { organizationId: orgId, provider: "RAZORPAY" } },
    });

    // Always require webhook secret — never skip verification
    if (!gatewayCfg?.webhookSecret) {
      console.warn("Razorpay webhook: no webhookSecret configured for org", orgId, "— rejecting");
      return NextResponse.json({ error: "Webhook secret not configured for this organization" }, { status: 401 });
    }
    const expectedSig = createHmac("sha256", gatewayCfg.webhookSecret)
      .update(rawBody)
      .digest("hex");
    if (expectedSig !== signature) {
      console.warn("Razorpay webhook signature mismatch for org", orgId);
      return NextResponse.json({ error: "Signature mismatch" }, { status: 401 });
    }

    // Idempotency: don't process the same link twice
    if (pl.status === "PAID") {
      return NextResponse.json({ received: true, skipped: "already_paid" });
    }

    const invoice = pl.invoice;
    const existingPayments = await prisma.payment.aggregate({
      where: { invoiceId: invoice.id },
      _sum: { amount: true },
    });
    const alreadyPaid = existingPayments._sum.amount ?? 0;
    const totalPaid = alreadyPaid + amount;
    const newStatus = totalPaid >= invoice.total ? "PAID" : "PARTIALLY_PAID";

    // Atomic update
    await prisma.$transaction([
      prisma.payment.create({
        data: {
          invoiceId: invoice.id,
          amount,
          method: "Online (Razorpay)",
          notes: `Payment ID: ${razorpayPaymentId}`,
          gatewayProvider: "RAZORPAY",
          gatewayPaymentId: razorpayPaymentId,
          paymentDate: new Date(),
        },
      }),
      prisma.invoice.update({
        where: { id: invoice.id },
        data: { status: newStatus as any },
      }),
      prisma.paymentLink.update({
        where: { id: pl.id },
        data: { status: "PAID", paidAt: new Date() },
      }),
      prisma.activityLog.create({
        data: {
          organizationId: orgId,
          entity: "Invoice",
          entityId: invoice.id,
          action: "PAYMENT_RECEIVED",
          meta: {
            amount,
            method: "Razorpay",
            gatewayPaymentId: razorpayPaymentId,
            newStatus,
          },
        },
      }),
    ]);

    console.log(`✅ Razorpay payment processed: Invoice ${invoice.id} → ${newStatus}`);
    return NextResponse.json({ received: true, invoiceId: invoice.id, newStatus });
  }

  // ── Handle payment.captured (direct payment, no link) ────────────
  if (event === "payment.captured") {
    // For direct payments, we match by amount + customer notes if provided
    // This is a best-effort match — payment_link.paid is more reliable
    return NextResponse.json({ received: true, event: "payment.captured", note: "Use payment_link.paid for reliable tracking" });
  }

  return NextResponse.json({ received: true, event, note: "Unhandled event" });
}
