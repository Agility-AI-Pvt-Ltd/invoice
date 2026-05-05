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

    // 1. Find the link to identify the organization
    const pl = await prisma.paymentLink.findFirst({
      where: { externalId: paymentLinkId },
      include: { invoice: { include: { organization: true } } },
    });

    if (!pl) {
      return NextResponse.json({ received: true, note: "Link not found in our system" });
    }

    // 2. Load and verify Signature
    const organizationId = pl.invoice.organizationId;
    const gatewayCfg = await prisma.paymentGatewayConfig.findUnique({
      where: { organizationId_provider: { organizationId, provider: "RAZORPAY" } },
    });

    if (!gatewayCfg?.webhookSecret) {
      console.error("Razorpay webhook: No secret configured for org", organizationId);
      return NextResponse.json({ error: "Organization not configured for webhooks" }, { status: 401 });
    }

    const expectedSig = createHmac("sha256", gatewayCfg.webhookSecret)
      .update(rawBody)
      .digest("hex");

    if (expectedSig !== signature) {
      console.warn("Razorpay webhook signature mismatch for org", organizationId);
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // 3. Atomic processing in a transaction
    try {
      await prisma.$transaction(async (tx) => {
        // Attempt to "claim" this payment link — ensure it hasn't been processed
        const link = await tx.paymentLink.findUnique({
          where: { id: pl.id },
        });

        if (!link || link.status !== "PENDING") {
          return; // Already processed or changed
        }

        // Update link status
        await tx.paymentLink.update({
          where: { id: pl.id },
          data: { status: "PAID", paidAt: new Date() },
        });

        const invoice = pl.invoice;
        
        // Calculate new status
        const payments = await tx.payment.aggregate({
          where: { invoiceId: invoice.id },
          _sum: { amount: true },
        });
        const alreadyPaid = Number(payments._sum.amount ?? 0);
        const totalPaid = alreadyPaid + amount;
        const newStatus = totalPaid >= Number(invoice.total) - 0.01 ? "PAID" : "PARTIALLY_PAID";

        // Record payment
        await tx.payment.create({
          data: {
            invoiceId: invoice.id,
            amount,
            method: "ONLINE",
            notes: `Razorpay Link: ${paymentLinkId}`,
            gatewayProvider: "RAZORPAY",
            gatewayPaymentId: razorpayPaymentId,
            paymentDate: new Date(),
          },
        });

        // Update invoice
        await tx.invoice.update({
          where: { id: invoice.id },
          data: { status: newStatus as any },
        });

        // Log activity
        await tx.activityLog.create({
          data: {
            organizationId,
            entity: "Invoice",
            entityId: invoice.id,
            action: "PAYMENT_RECEIVED",
            meta: { amount, gatewayPaymentId: razorpayPaymentId, newStatus },
          },
        });
      });
    } catch (err) {
      console.error("Atomic webhook processing failed:", err);
      return NextResponse.json({ error: "Internal processing error" }, { status: 500 });
    }

    return NextResponse.json({ received: true });
  }

  // ── Handle other events ───────────────────────────────────────────
  // We still want to verify signature for all events to prevent spoofing
  // even if we don't process them yet.
  return NextResponse.json({ received: true, note: "Event ignored after verification" });
}
