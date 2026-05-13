import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { getSession } from "@/lib/auth";
import Razorpay from "razorpay";
import { verifyOrgAccess, createErrorResponse, logApiAction } from "@/lib/api-utils";
import { checkAuthRateLimit } from "@/lib/ratelimit";
import { env } from "@/lib/env";

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
        { status: orgAccess.error.status }
      );
    }

    const orgId = orgAccess.org.id;

    // Rate limit payment link generation
    const rateLimit = await checkAuthRateLimit(`payment-link:${orgId}`);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: `Too many requests. Try again in ${rateLimit.retryAfter}s.` },
        { status: 429 }
      );
    }

    // Load invoice + customer + org
    const invoice = await prisma.invoice.findUnique({
      where: { id, organizationId: orgId },
      include: { customer: true, organization: true },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    if (invoice.status === "PAID") {
      return NextResponse.json({ error: "Invoice is already paid" }, { status: 400 });
    }

    // Load Razorpay credentials
    const gatewayCfg = await prisma.paymentGatewayConfig.findUnique({
      where: { organizationId_provider: { organizationId: orgId, provider: "RAZORPAY" } },
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

    const alreadyPaid = Number(payments._sum.amount ?? 0);
    const remaining = Number(invoice.total) - alreadyPaid;

    if (remaining <= 0) {
      return NextResponse.json({ error: "No outstanding balance" }, { status: 400 });
    }

    // Create Razorpay payment link
    const razorpay = new Razorpay({ key_id: gatewayCfg.keyId, key_secret: gatewayCfg.keySecret });

    // Type-safe Razorpay API call
    interface RazorpayLinkResponse {
      id: string;
      short_url: string;
      expire_by?: number;
    }

    const rzpLink = await (razorpay.paymentLink.create as (config: any) => Promise<RazorpayLinkResponse>)(
      {
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
        callback_url: `${env.NEXT_PUBLIC_APP_URL}/dashboard/invoices/${id}`,
        callback_method: "get",
      }
    );

    // Build UPI QR data string — only when org has a configured UPI ID
    const upiId = invoice.organization.upiId;
    const upiQrData = upiId
      ? `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(invoice.organization.name)}&am=${remaining.toFixed(2)}&tn=${encodeURIComponent(`Invoice ${invoice.invoiceNumber}`)}&cu=INR`
      : null;

    // Save to DB
    const paymentLink = await prisma.paymentLink.create({
      data: {
        invoiceId: id,
        provider: "RAZORPAY",
        externalId: rzpLink.id,
        shortUrl: rzpLink.short_url,
        upiQrData,
        status: "PENDING",
        expiresAt: rzpLink.expire_by ? new Date(rzpLink.expire_by * 1000) : null,
      },
    });

    // Update invoice status and log
    const statusUpdatePromise = invoice.status === "DRAFT"
      ? prisma.invoice.update({
          where: { id, organizationId: orgId },
          data: { status: "SENT" },
        })
      : Promise.resolve();

    await Promise.all([
      statusUpdatePromise,
      logApiAction(prisma, orgId, "Invoice", id, "PAYMENT_LINK_GENERATED", {
        provider: "RAZORPAY",
        externalId: rzpLink.id,
        shortUrl: rzpLink.short_url,
        amount: remaining,
      }),
    ]);

    return NextResponse.json({ shortUrl: rzpLink.short_url, upiQrData });
  } catch (err) {
    return createErrorResponse(err, "POST /api/invoices/[id]/payment-link");
  }
}
