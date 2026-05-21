import { requireAuth } from "../../../../lib/auth";
import { prisma } from "@repo/db";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { env } from "../../../../lib/env";
import { issueMcpVerificationCode } from "../../../../lib/mcp-auth";
import { McpAccessPanel } from "./McpAccessPanel";
import {
  Building2,
  CreditCard,
  Mail,
  MessageSquare,
  Save,
  CheckCircle,
} from "lucide-react";

const inputCls =
  "w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background text-foreground placeholder:text-muted-foreground/40 transition-all";
const labelCls =
  "block text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em] mb-1.5 ml-1";
const sectionHeaderCls =
  "px-6 py-5 border-b border-border/50 flex items-center gap-4 bg-secondary/10";

function SectionCard({
  icon,
  title,
  description,
  badge,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  badge?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm shadow-black/5">
      <div className={sectionHeaderCls}>
        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0 text-primary">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-foreground uppercase tracking-tight">
              {title}
            </h2>
            {badge && (
              <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-500/10 text-amber-600 rounded-full border border-amber-500/20 uppercase tracking-wider">
                {badge}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground/70 mt-0.5">
            {description}
          </p>
        </div>
      </div>
      <div className="p-6 md:p-8">{children}</div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label className={labelCls}>{label}</label>
      {children}
    </div>
  );
}

export default async function SettingsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = (await searchParams) ?? {};
  const mcpCode = typeof params.mcp_code === "string" ? params.mcp_code : undefined;
  const mcpExpiresAt =
    typeof params.mcp_expires_at === "string" ? params.mcp_expires_at : undefined;
  const headersList = await headers();
  const host = headersList.get("host");
  const isLocal = host?.includes("localhost");
  const proto =
    headersList.get("x-forwarded-proto") ?? (isLocal ? "http" : "https");
  const baseUrl =
    isLocal && host
      ? `${proto}://${host}`
      : env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  const webhookUrl = `${baseUrl}/api/webhooks/razorpay`;

  const user = await requireAuth();
  const orgId = user.ownedOrgs[0]?.id;
  if (!orgId) {
    redirect("/onboarding");
  }

  const [org, emailCfg, waConfig, pgConfigs] = await Promise.all([
    prisma.organization.findUnique({ where: { id: orgId } }),
    prisma.emailConfig.findUnique({ where: { organizationId: orgId } }),
    prisma.whatsAppConfig.findUnique({ where: { organizationId: orgId } }),
    prisma.paymentGatewayConfig.findMany({ where: { organizationId: orgId } }),
  ]);

  if (!org) return null;

  const razorpay = pgConfigs.find((p) => p.provider === "RAZORPAY");

  async function saveGeneral(fd: FormData) {
    "use server";
    const u = await requireAuth();
    const id = u.ownedOrgs[0]?.id;
    if (!id) redirect("/dashboard/settings?error=no_org");
    await prisma.organization.update({
      where: { id },
      data: {
        name: fd.get("name") as string,
        gstin: (fd.get("gstin") as string) || null,
        stateCode: (fd.get("stateCode") as string) || null,
        address: (fd.get("address") as string) || null,
        phone: (fd.get("phone") as string) || null,
        website: (fd.get("website") as string) || null,
        bankName: (fd.get("bankName") as string) || null,
        bankAccount: (fd.get("bankAccount") as string) || null,
        bankIfsc: (fd.get("bankIfsc") as string) || null,
        defaultTemplate: (fd.get("defaultTemplate") as string) || "modern",
        invoicePrefix: (fd.get("invoicePrefix") as string) || "INV",
        defaultDueDays: parseInt(fd.get("defaultDueDays") as string) || 30,
        inventoryTrackingEnabled: fd.get("inventoryTrackingEnabled") === "on",
      },
    });
    redirect("/dashboard/settings");
  }

  async function saveRazorpay(fd: FormData) {
    "use server";
    const u = await requireAuth();
    const id = u.ownedOrgs[0]?.id;
    if (!id) redirect("/dashboard/settings?error=no_org");
    const keyId = fd.get("razorpay_key_id") as string;
    const keySecret = fd.get("razorpay_key_secret") as string;
    const webhookSecret = fd.get("razorpay_webhook_secret") as string;
    if (!keyId || !keySecret) {
      redirect("/dashboard/settings?error=razorpay_missing");
    }
    await prisma.paymentGatewayConfig.upsert({
      where: {
        organizationId_provider: { organizationId: id, provider: "RAZORPAY" },
      },
      create: {
        organizationId: id,
        provider: "RAZORPAY",
        keyId,
        keySecret,
        webhookSecret: webhookSecret || null,
        isActive: true,
      },
      update: {
        keyId,
        keySecret,
        webhookSecret: webhookSecret || null,
        isActive: true,
      },
    });
    redirect("/dashboard/settings?success=razorpay");
  }

  async function saveEmail(fd: FormData) {
    "use server";
    const u = await requireAuth();
    const id = u.ownedOrgs[0]?.id;
    if (!id) redirect("/dashboard/settings?error=no_org");
    const provider = fd.get("email_provider") as "RESEND" | "SMTP" | "SENDGRID";
    await prisma.emailConfig.upsert({
      where: { organizationId: id },
      create: {
        organizationId: id,
        provider,
        apiKey: (fd.get("email_api_key") as string) || null,
        smtpHost: (fd.get("smtp_host") as string) || null,
        smtpPort: parseInt(fd.get("smtp_port") as string) || null,
        smtpUser: (fd.get("smtp_user") as string) || null,
        smtpPass: (fd.get("smtp_pass") as string) || null,
        fromName: (fd.get("from_name") as string) || "Billing",
        fromEmail: (fd.get("from_email") as string) || "",
      },
      update: {
        provider,
        apiKey: (fd.get("email_api_key") as string) || null,
        smtpHost: (fd.get("smtp_host") as string) || null,
        smtpPort: parseInt(fd.get("smtp_port") as string) || null,
        smtpUser: (fd.get("smtp_user") as string) || null,
        smtpPass: (fd.get("smtp_pass") as string) || null,
        fromName: (fd.get("from_name") as string) || "Billing",
        fromEmail: (fd.get("from_email") as string) || "",
      },
    });
    redirect("/dashboard/settings?success=email");
  }

  async function saveWhatsApp(fd: FormData) {
    "use server";
    const u = await requireAuth();
    const id = u.ownedOrgs[0]?.id;
    if (!id) redirect("/dashboard/settings?error=no_org");
    const provider = fd.get("wa_provider") as "TWILIO" | "WATI" | "META_CLOUD";
    await prisma.whatsAppConfig.upsert({
      where: { organizationId: id },
      create: {
        organizationId: id,
        provider,
        apiKey: fd.get("wa_api_key") as string,
        apiSecret: (fd.get("wa_api_secret") as string) || null,
        phoneNumberId: (fd.get("wa_phone_number_id") as string) || null,
        businessNumber: fd.get("wa_business_number") as string,
        isActive: true,
      },
      update: {
        provider,
        apiKey: fd.get("wa_api_key") as string,
        apiSecret: (fd.get("wa_api_secret") as string) || null,
        phoneNumberId: (fd.get("wa_phone_number_id") as string) || null,
        businessNumber: fd.get("wa_business_number") as string,
        isActive: true,
      },
    });
    redirect("/dashboard/settings?success=whatsapp");
  }

  async function generateMcpCode() {
    "use server";
    const u = await requireAuth();
    const issuedCode = issueMcpVerificationCode(u);
    const query = new URLSearchParams({
      mcp_code: issuedCode.code,
      mcp_expires_at: issuedCode.expiresAt,
    });
    redirect(`/dashboard/settings?${query.toString()}`);
  }

  return (
    <div className="p-8 max-w-4xl mx-auto w-full space-y-8 pb-20 animate-in fade-in duration-700">
      <div>
        <h1 className="text-3xl font-bold tracking-tight heading-display text-foreground">
          Settings
        </h1>
        <p className="text-muted-foreground mt-1.5">
          Manage your business profile, invoice design, and automated
          integrations.
        </p>
      </div>

      <div className="space-y-8">
        {/* ── Business & Invoice Settings ── */}
        <form action={saveGeneral}>
          <SectionCard
            icon={<Building2 className="w-5 h-5" />}
            title="Business & Invoice"
            description="Your public business details and default settings for all new invoices."
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Field label="Business Name *">
                <input
                  name="name"
                  required
                  defaultValue={org.name}
                  className={inputCls}
                />
              </Field>
              <Field label="GSTIN">
                <input
                  name="gstin"
                  defaultValue={org.gstin || ""}
                  placeholder="27AAAAA0000A1Z5"
                  className={inputCls}
                />
              </Field>
              <Field label="State Code">
                <input
                  name="stateCode"
                  defaultValue={org.stateCode || ""}
                  placeholder="e.g. 27"
                  className={inputCls}
                />
              </Field>
              <Field label="Phone">
                <input
                  name="phone"
                  defaultValue={org.phone || ""}
                  placeholder="+91 98765 43210"
                  className={inputCls}
                />
              </Field>
              <Field label="Address">
                <input
                  name="address"
                  defaultValue={org.address || ""}
                  placeholder="Your full business address"
                  className={inputCls}
                />
              </Field>
              <Field label="Website">
                <input
                  name="website"
                  defaultValue={org.website || ""}
                  placeholder="https://yourcompany.com"
                  className={inputCls}
                />
              </Field>

              <div className="md:col-span-2 pt-4 border-t border-border/50">
                <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-[0.2em] mb-4">
                  Bank Details (Displayed on PDF)
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Field label="Bank Name">
                    <input
                      name="bankName"
                      defaultValue={org.bankName || ""}
                      placeholder="HDFC Bank"
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Account Number">
                    <input
                      name="bankAccount"
                      defaultValue={org.bankAccount || ""}
                      placeholder="XXXX XXXX XXXX"
                      className={inputCls}
                    />
                  </Field>
                  <Field label="IFSC Code">
                    <input
                      name="bankIfsc"
                      defaultValue={org.bankIfsc || ""}
                      placeholder="HDFC0001234"
                      className={inputCls}
                    />
                  </Field>
                </div>
              </div>

              <div className="md:col-span-2 pt-4 border-t border-border/50">
                <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-[0.2em] mb-4">
                  Invoice Defaults
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Field label="Invoice Prefix">
                    <input
                      name="invoicePrefix"
                      defaultValue={org.invoicePrefix || "INV"}
                      placeholder="INV"
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Default Due Days">
                    <input
                      name="defaultDueDays"
                      type="number"
                      defaultValue={org.defaultDueDays || 30}
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Default Template">
                    <select
                      name="defaultTemplate"
                      defaultValue={org.defaultTemplate}
                      className={inputCls}
                    >
                      <option value="modern">Modern (Dark Header)</option>
                      <option value="classic">Classic (Traditional)</option>
                      <option value="minimal">Minimal (Clean)</option>
                    </select>
                  </Field>
                </div>
                <div className="md:col-span-3 flex items-start gap-3 pt-2">
                  <input
                    type="checkbox"
                    id="inventoryTrackingEnabled"
                    name="inventoryTrackingEnabled"
                    defaultChecked={org.inventoryTrackingEnabled}
                    className="mt-1 w-4 h-4 rounded border-border text-primary focus:ring-primary/20 cursor-pointer"
                  />
                  <div>
                    <label
                      htmlFor="inventoryTrackingEnabled"
                      className="text-sm font-semibold text-foreground cursor-pointer"
                    >
                      Track inventory (stock)
                    </label>
                    <p className="text-xs text-muted-foreground mt-0.5 max-w-xl">
                      When enabled, recording a payment that puts an invoice in{" "}
                      <span className="font-medium text-foreground">
                        Partially paid
                      </span>{" "}
                      or{" "}
                      <span className="font-medium text-foreground">Paid</span>{" "}
                      deducts on-hand quantity (full line quantities, once per
                      line) for items linked to catalog products of type{" "}
                      <span className="font-medium text-foreground">Good</span>.
                      Ensure each SKU has stock in{" "}
                      <a
                        href="/dashboard/inventory"
                        className="text-primary font-medium hover:underline"
                      >
                        Inventory
                      </a>
                      .
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end mt-8 pt-6 border-t border-border/50">
              <button
                type="submit"
                className="group flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground text-sm font-bold rounded-xl hover:opacity-90 transition-all shadow-lg shadow-primary/20 active:scale-95"
              >
                <Save className="w-4 h-4 group-hover:scale-110 transition-transform" />
                Save Business Profile
              </button>
            </div>
          </SectionCard>
        </form>

        {/* ── Razorpay ── */}
        <form action={saveRazorpay}>
          <SectionCard
            icon={<CreditCard className="w-5 h-5" />}
            title="Razorpay"
            description="Auto-track payments — when a customer pays via Razorpay, invoice status updates automatically"
            badge={razorpay ? undefined : "Not configured"}
          >
            {razorpay && (
              <div className="flex items-center gap-2 mb-6 text-xs text-green-700 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3">
                <CheckCircle className="w-3.5 h-3.5" />
                <span className="font-semibold">
                  Connected · Key ID: {razorpay.keyId.slice(0, 8)}••••
                </span>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Field label="Key ID (From Razorpay)">
                <input
                  name="razorpay_key_id"
                  required
                  placeholder="rzp_live_..."
                  defaultValue={razorpay?.keyId || ""}
                  className={inputCls}
                />
                <p className="text-[9px] text-muted-foreground mt-1 ml-1">
                  Example: rzp_live_xxxxxxxxxxxx (Not your email)
                </p>
              </Field>
              <Field label="Key Secret">
                <input
                  name="razorpay_key_secret"
                  required
                  type="password"
                  placeholder="••••••••••••••••"
                  defaultValue={razorpay?.keySecret || ""}
                  className={inputCls}
                />
              </Field>
              <Field label="Webhook Secret">
                <input
                  name="razorpay_webhook_secret"
                  type="password"
                  placeholder="e.g. inv_webhook_secure_123"
                  defaultValue={razorpay?.webhookSecret || ""}
                  className={inputCls}
                />
                <p className="text-[9px] text-muted-foreground mt-1 ml-1 italic">
                  Suggestion: Use a strong random string like "inv_sec_
                  {Math.random().toString(36).slice(2, 10)}"
                </p>
              </Field>
              <div className="flex flex-col justify-end">
                <div className="text-[10px] text-muted-foreground leading-relaxed bg-secondary/30 p-4 rounded-xl border border-border/50">
                  <span className="font-bold uppercase tracking-wider block mb-2 opacity-50">
                    Razorpay Webhook Setup:
                  </span>
                  <p className="mb-3 opacity-70">
                    1. Go to Razorpay Dashboard → Settings → Webhooks
                  </p>
                  <p className="mb-3 opacity-70">
                    2. Click 'Add New Webhook' and use the URL below:
                  </p>
                  <div className="bg-background border border-border rounded-lg p-2.5 flex items-center justify-between group/url">
                    <code className="text-primary font-mono text-[11px] break-all select-all">
                      {webhookUrl}
                    </code>
                  </div>
                  <p className="mt-3 text-[9px] opacity-40 font-medium italic">
                    Events: payment_link.paid, payment.captured
                  </p>
                </div>
              </div>
            </div>
            <div className="flex justify-end mt-8 pt-6 border-t border-border/50">
              <button
                type="submit"
                className="group flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground text-sm font-bold rounded-xl hover:opacity-90 transition-all shadow-lg shadow-primary/20 active:scale-95"
              >
                <Save className="w-4 h-4 group-hover:scale-110 transition-transform" />
                {razorpay ? "Update Configuration" : "Connect Razorpay"}
              </button>
            </div>
          </SectionCard>
        </form>

        {/* ── Email ── */}
        <form action={saveEmail}>
          <SectionCard
            icon={<Mail className="w-5 h-5" />}
            title="Email Delivery"
            description="Send invoices and payment receipts directly via professional email templates."
            badge={emailCfg ? undefined : "Not configured"}
          >
            {emailCfg && (
              <div className="flex items-center gap-2 mb-6 text-xs text-green-700 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3">
                <CheckCircle className="w-3.5 h-3.5" />
                <span className="font-semibold">
                  Configured · From: {emailCfg.fromEmail} · Provider:{" "}
                  {emailCfg.provider}
                </span>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Field label="Email Provider">
                <select
                  name="email_provider"
                  defaultValue={emailCfg?.provider || "RESEND"}
                  className={inputCls}
                >
                  <option value="RESEND">Resend (Highly Recommended)</option>
                  <option value="SENDGRID">SendGrid</option>
                  <option value="SMTP">Custom SMTP</option>
                </select>
              </Field>
              <Field label="API Key (Resend / SendGrid)">
                <input
                  name="email_api_key"
                  type="password"
                  placeholder="re_••••••"
                  defaultValue={emailCfg?.apiKey || ""}
                  className={inputCls}
                />
              </Field>
              <Field label="From Name">
                <input
                  name="from_name"
                  placeholder="Acme Billing"
                  defaultValue={emailCfg?.fromName || org.name}
                  className={inputCls}
                />
              </Field>
              <Field label="From Email">
                <input
                  name="from_email"
                  type="email"
                  placeholder="billing@yourcompany.com"
                  defaultValue={emailCfg?.fromEmail || ""}
                  className={inputCls}
                />
              </Field>

              <div className="md:col-span-2 pt-4 border-t border-border/50">
                <div className="p-4 bg-secondary/30 rounded-xl border border-border/50">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
                    SMTP Settings (Only for Custom SMTP)
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Field label="Host">
                      <input
                        name="smtp_host"
                        placeholder="smtp.gmail.com"
                        defaultValue={emailCfg?.smtpHost || ""}
                        className={inputCls}
                      />
                    </Field>
                    <Field label="Port">
                      <input
                        name="smtp_port"
                        type="number"
                        placeholder="587"
                        defaultValue={emailCfg?.smtpPort || ""}
                        className={inputCls}
                      />
                    </Field>
                    <Field label="User">
                      <input
                        name="smtp_user"
                        placeholder="you@gmail.com"
                        defaultValue={emailCfg?.smtpUser || ""}
                        className={inputCls}
                      />
                    </Field>
                    <Field label="Password">
                      <input
                        name="smtp_pass"
                        type="password"
                        placeholder="••••••••"
                        defaultValue={emailCfg?.smtpPass || ""}
                        className={inputCls}
                      />
                    </Field>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end mt-8 pt-6 border-t border-border/50">
              <button
                type="submit"
                className="group flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground text-sm font-bold rounded-xl hover:opacity-90 transition-all shadow-lg shadow-primary/20 active:scale-95"
              >
                <Save className="w-4 h-4 group-hover:scale-110 transition-transform" />
                {emailCfg ? "Update Email Config" : "Save Email Delivery"}
              </button>
            </div>
          </SectionCard>
        </form>

        {/* ── WhatsApp ── */}
        <form action={saveWhatsApp}>
          <SectionCard
            icon={<MessageSquare className="w-5 h-5" />}
            title="WhatsApp Delivery"
            description="Send invoices and payment links directly via WhatsApp Business API."
            badge={waConfig ? undefined : "Not configured"}
          >
            {waConfig && (
              <div className="flex items-center gap-2 mb-6 text-xs text-green-700 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3">
                <CheckCircle className="w-3.5 h-3.5" />
                <span className="font-semibold">
                  Connected · Number: {waConfig.businessNumber}
                </span>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Field label="Provider">
                <select
                  name="wa_provider"
                  defaultValue={waConfig?.provider || "TWILIO"}
                  className={inputCls}
                >
                  <option value="TWILIO">Twilio</option>
                  <option value="WATI">WATI</option>
                  <option value="META_CLOUD">Meta Cloud API</option>
                </select>
              </Field>
              <Field label="Business WhatsApp Number">
                <input
                  name="wa_business_number"
                  placeholder="+919876543210"
                  defaultValue={waConfig?.businessNumber || ""}
                  className={inputCls}
                />
              </Field>
              <Field label="API Key / Account SID">
                <input
                  name="wa_api_key"
                  type="password"
                  placeholder="••••••••"
                  defaultValue={waConfig?.apiKey || ""}
                  className={inputCls}
                />
              </Field>
              <Field label="Auth Token / API Secret">
                <input
                  name="wa_api_secret"
                  type="password"
                  placeholder="••••••••"
                  defaultValue={waConfig?.apiSecret || ""}
                  className={inputCls}
                />
              </Field>
              <Field label="Phone Number ID (Meta Only)">
                <input
                  name="wa_phone_number_id"
                  placeholder="From Meta Dashboard"
                  defaultValue={waConfig?.phoneNumberId || ""}
                  className={inputCls}
                />
              </Field>
            </div>
            <div className="flex justify-end mt-8 pt-6 border-t border-border/50">
              <button
                type="submit"
                className="group flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground text-sm font-bold rounded-xl hover:opacity-90 transition-all shadow-lg shadow-primary/20 active:scale-95"
              >
                <Save className="w-4 h-4 group-hover:scale-110 transition-transform" />
                {waConfig ? "Update WhatsApp" : "Enable WhatsApp"}
              </button>
            </div>
          </SectionCard>
        </form>

        <McpAccessPanel
          code={mcpCode}
          expiresAt={mcpExpiresAt}
          generateAction={generateMcpCode}
        />
      </div>
    </div>
  );
}
