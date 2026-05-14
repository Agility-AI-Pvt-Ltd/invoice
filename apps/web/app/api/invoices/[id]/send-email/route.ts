import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { getSession } from "@/lib/auth";
import { renderToBuffer } from "@react-pdf/renderer";
import { buildPDF } from "@/lib/pdf-templates";
import nodemailer from "nodemailer";
import { checkAuthRateLimit } from "@/lib/ratelimit";
import { verifyOrgAccess, createErrorResponse } from "@/lib/api-utils";

export async function POST(
  _req: Request,
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

    // Rate limit email sending per organization
    const { allowed, retryAfter } = await checkAuthRateLimit(`email:${orgId}`);
    if (!allowed) {
      return NextResponse.json(
        { error: `Too many email attempts. Please try again in ${retryAfter} seconds.` },
        { status: 429 }
      );
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id, organizationId: orgId },
      include: { customer: true, organization: true, paymentLinks: { where: { status: "PENDING" } } },
    });
    if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

    const toEmail = invoice.customer.email;
    if (!toEmail) {
      return NextResponse.json({ error: "Customer has no email address" }, { status: 400 });
    }

    const emailCfg = await prisma.emailConfig.findUnique({ where: { organizationId: orgId } });
    if (!emailCfg) {
      return NextResponse.json(
        { error: "Email not configured. Go to Settings → Email Delivery." },
        { status: 400 }
      );
    }
    if (!emailCfg.fromEmail || emailCfg.fromEmail === "billing@example.com") {
      return NextResponse.json(
        { error: "Set a valid From Email in Settings → Email Delivery before sending." },
        { status: 400 }
      );
    }
    if (!emailCfg.smtpHost || !emailCfg.smtpUser || !emailCfg.smtpPass) {
      return NextResponse.json(
        { error: "SMTP is not fully configured. Set SMTP Host, User, and Password in Settings → Email Delivery." },
        { status: 400 }
      );
    }

    const paymentLink = invoice.paymentLinks[0]?.shortUrl;
    const html = buildEmailHtml(invoice, paymentLink);
    const subject = `Invoice ${invoice.invoiceNumber} from ${invoice.organization.name} — ₹${Number(invoice.total).toFixed(2)}`;

    // Generate PDF for attachment
    const pdfDoc = buildPDF(invoice as any, (invoice.organization as any).defaultTemplate || "modern");
    const pdfBuffer = await renderToBuffer(pdfDoc);

    const transporter = nodemailer.createTransport({
      host: emailCfg.smtpHost,
      port: emailCfg.smtpPort || 587,
      secure: (emailCfg.smtpPort || 587) === 465,
      auth: { user: emailCfg.smtpUser, pass: emailCfg.smtpPass },
    });

    await transporter.sendMail({
      from: `${emailCfg.fromName} <${emailCfg.fromEmail}>`,
      to: toEmail,
      subject,
      html,
      attachments: [
        {
          filename: `${invoice.invoiceNumber}.pdf`,
          content: pdfBuffer,
        },
      ],
    });

    // Mark as SENT + log
    await prisma.$transaction([
      prisma.invoice.update({ where: { id }, data: { status: "SENT" } }),
      prisma.activityLog.create({
        data: {
          organizationId: orgId,
          entity: "Invoice",
          entityId: id,
          action: "EMAIL_SENT",
          meta: { to: toEmail, provider: "SMTP" },
        },
      }),
    ]);

    return NextResponse.json({ success: true, sentTo: toEmail });
  } catch (err) {
    return createErrorResponse(err, "POST /api/invoices/[id]/send-email");
  }
}

function buildEmailHtml(invoice: any, paymentLink?: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f8f8f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:32px auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
    <div style="background:#111827;padding:28px 32px;">
      <h1 style="margin:0;font-size:20px;color:#ffffff;font-weight:700;">${invoice.organization.name}</h1>
      <p style="margin:6px 0 0;color:#9ca3af;font-size:13px;">Invoice ${invoice.invoiceNumber}</p>
    </div>
    <div style="padding:28px 32px;">
      <p style="margin:0 0 20px;font-size:15px;color:#374151;">Hi <strong>${invoice.customer.name}</strong>,</p>
      <p style="margin:0 0 24px;font-size:14px;color:#6b7280;line-height:1.6;">
        Please find your invoice from <strong>${invoice.organization.name}</strong>. 
        Due date is <strong>${new Date(invoice.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</strong>.
      </p>
      <div style="background:#f9fafb;border-radius:8px;padding:20px;border:1px solid #e5e7eb;margin-bottom:24px;">
        <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
          <span style="font-size:13px;color:#6b7280;">Invoice No.</span>
          <span style="font-size:13px;color:#111827;font-weight:600;">${invoice.invoiceNumber}</span>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
          <span style="font-size:13px;color:#6b7280;">Due Date</span>
          <span style="font-size:13px;color:#111827;">${new Date(invoice.dueDate).toLocaleDateString("en-IN")}</span>
        </div>
        <div style="display:flex;justify-content:space-between;border-top:1px solid #e5e7eb;padding-top:12px;margin-top:4px;">
          <span style="font-size:15px;font-weight:700;color:#111827;">Total Due</span>
          <span style="font-size:18px;font-weight:800;color:#111827;">₹${Number(invoice.total).toFixed(2)}</span>
        </div>
      </div>
      ${paymentLink ? `
      <div style="text-align:center;margin-bottom:24px;">
        <a href="${paymentLink}" style="display:inline-block;background:#111827;color:#ffffff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">
          Pay Now →
        </a>
      </div>` : ''}
      <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">
        Questions? Reply to this email or contact ${invoice.organization.name}.
      </p>
    </div>
    <div style="padding:16px 32px;background:#f9fafb;border-top:1px solid #e5e7eb;text-align:center;">
      <p style="margin:0;font-size:11px;color:#9ca3af;">Sent via Invoicely</p>
    </div>
  </div>
</body>
</html>`;
}
