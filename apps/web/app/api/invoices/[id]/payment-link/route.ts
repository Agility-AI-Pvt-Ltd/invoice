import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { getSession } from "../../../../../lib/auth";
import Razorpay from "razorpay";

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

    // Load invoice + customer + org
    const invoice = await prisma.invoice.findUnique({
      where: { id, organizationId },
      include: { customer: true, organization: true },
    });
    if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    if (invoice.status === "PAID") {
      return NextResponse.json({ error: "Invoice is already paid" }, { status: 400 });
    }

    // Load Razorpay credentials
    const gatewayCfg = await prisma.paymentGatewayConfig.findUnique({
      where: { organizationId_provider: { organizationId, provider: "RAZORPAY" } },
    });
    if (!gatewayCfg || !gatewayCfg.isActive) {
      return NextResponse.json(
        { error: "Razorpay not configured. Go to Settings → Razorpay to connect." },
        { status: 400 }
      );
    }

    // Check for existing active link
    const existingLink = await prisma.paymentLink.findFirst({
      where: { invoiceId: id, status: "PENDING" },
    });
    if (existingLink) {
      return NextResponse.json({ shortUrl: existingLink.shortUrl, alreadyExists: true });
    }

    // Calculate remaining balance (account for partial payments)
    const payments = await prisma.payment.aggregate({
      where: { invoiceId: id },
      _sum: { amount: true },
    });
    const alreadyPaid = payments._sum.amount ?? 0;
    const remaining = invoice.total - alreadyPaid;
    if (remaining <= 0) {
      return NextResponse.json({ error: "No outstanding balance" }, { status: 400 });
    }

    // Create Razorpay payment link
    const razorpay = new Razorpay({ key_id: gatewayCfg.keyId, key_secret: gatewayCfg.keySecret });
    const rzpLink = await (razorpay.paymentLink as any).create({
      amount: Math.round(remaining * 100), // rupees → paise
      currency: invoice.organization.currency || "INR",
      description: `Invoice ${invoice.invoiceNumber} — ${invoice.organization.name}`,
      reference_id: invoice.invoiceNumber,
      customer: {
        name: invoice.customer.name,
        email: invoice.customer.email || undefined,
        contact: invoice.customer.phone || undefined,
      },
      notify: {
        sms: !!invoice.customer.phone,
        email: !!invoice.customer.email,
      },
      reminder_enable: true,
      notes: {
        invoice_id: invoice.id,
        org_id: organizationId,
      },
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/invoices/${id}`,
      callback_method: "get",
    });

    // Build UPI QR data string (standard UPI deep link)
    const upiQrData = `upi://pay?pa=${encodeURIComponent(organizationId)}&pn=${encodeURIComponent(invoice.organization.name)}&am=${remaining.toFixed(2)}&tn=${encodeURIComponent(`Invoice ${invoice.invoiceNumber}`)}&cu=INR`;

    // Save to DB
    await prisma.$transaction([
      prisma.paymentLink.create({
        data: {
          invoiceId: id,
          provider: "RAZORPAY",
          externalId: rzpLink.id,
          shortUrl: rzpLink.short_url,
          upiQrData,
          status: "PENDING",
          expiresAt: rzpLink.expire_by ? new Date(rzpLink.expire_by * 1000) : null,
        },
      }),
      prisma.invoice.update({
        where: { id },
        data: { status: "SENT" },
      }),
      prisma.activityLog.create({
        data: {
          organizationId,
          entity: "Invoice",
          entityId: id,
          action: "PAYMENT_LINK_GENERATED",
          meta: { provider: "RAZORPAY", externalId: rzpLink.id, shortUrl: rzpLink.short_url },
        },
      }),
    ]);

    return NextResponse.json({ shortUrl: rzpLink.short_url, upiQrData });
  } catch (err: any) {
    console.error("Payment link error:", err);
    return NextResponse.json(
      { error: err?.error?.description || err?.message || "Failed to generate payment link" },
      { status: 500 }
    );
  }
}
