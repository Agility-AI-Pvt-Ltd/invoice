import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { applyInventoryOnFullPayment } from "@/lib/domain/inventory";
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

    const invoiceId = pl.invoice.id;

    // 3. Atomic processing in a transaction
    try {
      await prisma.$transaction(async (tx) => {
        const link = await tx.paymentLink.findUnique({
          where: { id: pl.id },
        });

        if (!link) {
          console.warn("Webhook: Payment link not found in transaction", { linkId: pl.id });
          return;
        }

        if (link.status !== "PENDING") {
          console.info("Webhook: Payment link already processed", {
            linkId: pl.id,
            status: link.status,
          });
          return; // Idempotent response
        }

        const invoiceRow = await tx.invoice.findUnique({
          where: { id: invoiceId },
        });

        if (!invoiceRow) {
          console.error("Webhook: Invoice not found in transaction", { invoiceId });
          return;
        }

        // Duplicate webhook or manual payment settled the invoice first — close the link so Razorpay stops retrying.
        if (invoiceRow.status === "PAID") {
          console.warn("Webhook: Invoice already PAID; closing payment link only", { invoiceId });
          await tx.paymentLink.update({
            where: { id: pl.id },
            data: { status: "PAID", paidAt: link.paidAt ?? new Date() },
          });
          return;
        }

        if (invoiceRow.status === "CANCELLED") {
          console.error("Webhook: Payment captured for CANCELLED invoice — reconcile manually", {
            invoiceId,
            paymentLinkId,
          });
          await tx.paymentLink.update({
            where: { id: pl.id },
            data: { status: "PAID", paidAt: new Date() },
          });
          return;
        }

        // Same Razorpay payment event delivered twice (race) — do not double-book.
        if (razorpayPaymentId) {
          const existingPayment = await tx.payment.findFirst({
            where: { invoiceId, gatewayPaymentId: razorpayPaymentId },
          });
          if (existingPayment) {
            console.info("Webhook: Duplicate gateway payment id; closing link", {
              invoiceId,
              razorpayPaymentId,
            });
            await tx.paymentLink.update({
              where: { id: pl.id },
              data: { status: "PAID", paidAt: link.paidAt ?? new Date() },
            });
            return;
          }
        }

        // Update payment link status
        await tx.paymentLink.update({
          where: { id: pl.id },
          data: { status: "PAID", paidAt: new Date() },
        });

        const previousStatus = invoiceRow.status;

        // Calculate totals with precise Decimal math
        const payments = await tx.payment.aggregate({
          where: { invoiceId },
          _sum: { amount: true },
        });
        const alreadyPaid = Number(payments._sum.amount ?? 0);
        const totalPaid = alreadyPaid + amount;
        const newStatus =
          totalPaid >= Number(invoiceRow.total) - 0.01 ? "PAID" : "PARTIALLY_PAID";

        // Validate amount is reasonable (within tolerance)
        const expectedAmount = Number(invoiceRow.total) - alreadyPaid;
        const amountDiff = Math.abs(amount - expectedAmount);
        if (amountDiff > 0.01) {
          console.warn("Webhook: Amount mismatch detected", {
            expected: expectedAmount,
            received: amount,
            difference: amountDiff,
            invoiceId,
          });
          // Log but continue - might be partial payment or rounding
        }

        // Record payment
        const payment = await tx.payment.create({
          data: {
            invoiceId,
            amount,
            method: "ONLINE",
            notes: `Razorpay Link: ${paymentLinkId}`,
            gatewayProvider: "RAZORPAY",
            gatewayPaymentId: razorpayPaymentId,
            paymentDate: new Date(),
          },
        });

        // Update invoice status
        await tx.invoice.update({
          where: { id: invoiceId },
          data: { status: newStatus },
        });

        // Apply inventory changes if needed
        await applyInventoryOnFullPayment(tx, {
          organizationId,
          invoiceId,
          previousStatus,
          newStatus,
        });

        // Log the action
        await tx.activityLog.create({
          data: {
            organizationId,
            entity: "Invoice",
            entityId: invoiceId,
            action: "PAYMENT_RECEIVED",
            meta: {
              amount,
              gatewayPaymentId: razorpayPaymentId,
              newStatus,
              paymentId: payment.id,
            },
          },
        });

        console.info("Webhook: Payment processed successfully", {
          invoiceId,
          paymentId: payment.id,
          newStatus,
        });
      });
    } catch (err) {
      console.error("Webhook: Transaction processing failed", {
        error: err instanceof Error ? err.message : String(err),
        invoiceId,
        paymentLinkId,
        stack: err instanceof Error ? err.stack : undefined,
      });
      return NextResponse.json({ error: "Internal processing error" }, { status: 500 });
    }

    return NextResponse.json({ received: true });
  }

  return NextResponse.json({ error: "Unsupported or unhandled event type" }, { status: 400 });
}
