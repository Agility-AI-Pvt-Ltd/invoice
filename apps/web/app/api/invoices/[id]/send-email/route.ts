import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { getSession } from "../../../../../lib/auth";
import nodemailer from "nodemailer";
import { Resend } from "resend";

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

    const invoice = await prisma.invoice.findUnique({
      where: { id, organizationId },
      include: { customer: true, organization: true, paymentLinks: { where: { status: "PENDING" } } },
    });
    if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

    const toEmail = invoice.customer.email;
    if (!toEmail) {
      return NextResponse.json({ error: "Customer has no email address" }, { status: 400 });
    }

    const emailCfg = await prisma.emailConfig.findUnique({ where: { organizationId } });
    if (!emailCfg) {
      return NextResponse.json(
        { error: "Email not configured. Go to Settings → Email Delivery." },
        { status: 400 }
      );
    }

    const paymentLink = invoice.paymentLinks[0]?.shortUrl;
    const html = buildEmailHtml(invoice, paymentLink);
    const subject = `Invoice ${invoice.invoiceNumber} from ${invoice.organization.name} — ₹${invoice.total.toFixed(2)}`;

    if (emailCfg.provider === "RESEND" && emailCfg.apiKey) {
      const resend = new Resend(emailCfg.apiKey);
      await resend.emails.send({
        from: `${emailCfg.fromName} <${emailCfg.fromEmail}>`,
        to: [toEmail],
        subject,
        html,
      });
    } else if (emailCfg.provider === "SMTP" && emailCfg.smtpHost) {
      const transporter = nodemailer.createTransport({
        host: emailCfg.smtpHost,
        port: emailCfg.smtpPort || 587,
        secure: (emailCfg.smtpPort || 587) === 465,
        auth: { user: emailCfg.smtpUser || undefined, pass: emailCfg.smtpPass || undefined },
      });
      await transporter.sendMail({
        from: `${emailCfg.fromName} <${emailCfg.fromEmail}>`,
        to: toEmail, subject, html,
      });
    } else if (emailCfg.provider === "SENDGRID" && emailCfg.apiKey) {
      const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: { Authorization: `Bearer ${emailCfg.apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: toEmail }] }],
          from: { email: emailCfg.fromEmail, name: emailCfg.fromName },
          subject, content: [{ type: "text/html", value: html }],
        }),
      });
      if (!res.ok) throw new Error("SendGrid error: " + (await res.text()));
    }

    // Mark as SENT + log
    await prisma.$transaction([
      prisma.invoice.update({ where: { id }, data: { status: "SENT" } }),
      prisma.activityLog.create({
        data: {
          organizationId,
          entity: "Invoice",
          entityId: id,
          action: "EMAIL_SENT",
          meta: { to: toEmail, provider: emailCfg.provider },
        },
      }),
    ]);

    return NextResponse.json({ success: true, sentTo: toEmail });
  } catch (err: any) {
    console.error("Email send error:", err);
    return NextResponse.json({ error: err.message || "Failed to send email" }, { status: 500 });
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
          <span style="font-size:18px;font-weight:800;color:#111827;">₹${invoice.total.toFixed(2)}</span>
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
      <p style="margin:0;font-size:11px;color:#9ca3af;">Sent via InvoiceHQ</p>
    </div>
  </div>
</body>
</html>`;
}
