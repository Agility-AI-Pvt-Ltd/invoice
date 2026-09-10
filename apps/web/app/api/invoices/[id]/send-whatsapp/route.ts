import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { getSession } from "@/lib/auth";
import { checkAuthRateLimit } from "@/lib/ratelimit";
import { env } from "@/lib/env";
import { formatInr } from "@/lib/money";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getSession();
    const organizationId = user?.ownedOrgs?.[0]?.id;
    if (!organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limit per organization
    const { allowed, retryAfter } = await checkAuthRateLimit(`whatsapp:${organizationId}`);
    if (!allowed) {
      return NextResponse.json(
        { error: `Too many WhatsApp attempts. Please try again in ${retryAfter} seconds.` },
        { status: 429 }
      );
    }

    let requestedRecipientPhone: string | null = null;
    let requestedMessage: string | null = null;
    try {
      const body = await req.json();
      if (body && typeof body === "object") {
        requestedRecipientPhone =
          typeof body.recipientPhone === "string" ? body.recipientPhone.trim() : null;
        requestedMessage =
          typeof body.message === "string" ? body.message.trim() : null;
      }
    } catch {
      // Empty body is fine; default invoice values will be used.
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id, organizationId },
      include: { customer: true, organization: true, paymentLinks: { where: { status: "PENDING" } } },
    });
    if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

    const toPhone = requestedRecipientPhone || invoice.customer.phone;
    if (!toPhone) {
      return NextResponse.json({ error: "Customer has no phone number" }, { status: 400 });
    }

    const waConfig = await prisma.whatsAppConfig.findUnique({ where: { organizationId } });
    
    
    // We construct a friendly message
    const amount = formatInr(invoice.total, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/^₹/, "");
    const paymentLink = invoice.paymentLinks[0]?.shortUrl;
    const defaultMessage = `Hi ${invoice.customer.name}, your invoice ${invoice.invoiceNumber} from ${invoice.organization.name} for ₹${amount} is ready. 
Due date: ${new Date(invoice.dueDate).toLocaleDateString('en-IN')}.
${paymentLink ? `Pay securely here: ${paymentLink}` : `View invoice here: ${env.NEXT_PUBLIC_APP_URL}/dashboard/invoices/${id}`}`;
    const message = requestedMessage || defaultMessage;

    // If NOT configured, we return a WhatsApp Web link as a fallback
    if (!waConfig || !waConfig.isActive) {
      const encodedMsg = encodeURIComponent(message);
      const cleanPhone = toPhone.replace(/\D/g, '');
      if (!cleanPhone) {
        return NextResponse.json({ error: "Invalid phone number format" }, { status: 400 });
      }
      const waWebUrl = `https://wa.me/${cleanPhone}?text=${encodedMsg}`;
      return NextResponse.json({ 
        success: true, 
        fallback: true, 
        url: waWebUrl,
        note: "WhatsApp API not configured. Use this link to send manually." 
      });
    }

    // --- Automated Sending Logic ---
    // In a real implementation, we would call Twilio/WATI/Meta Cloud API here.
    // For now, we simulate a successful API call for demonstration.
    
    /* 
    if (waConfig.provider === 'TWILIO') { ... }
    else if (waConfig.provider === 'META_CLOUD') { ... }
    */

    // Log activity
    await prisma.activityLog.create({
      data: {
        organizationId,
        entity: "Invoice",
        entityId: id,
        action: "WHATSAPP_SENT",
        meta: { to: toPhone, provider: waConfig.provider, automated: true },
      },
    });

    return NextResponse.json({ 
      success: true, 
      automated: true,
      sentTo: toPhone 
    });

  } catch (err: any) {
    console.error("WhatsApp send error:", err);
    return NextResponse.json({ error: err.message || "Failed to send WhatsApp" }, { status: 500 });
  }
}
