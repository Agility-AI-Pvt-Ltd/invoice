import { requireAuth } from '../../../../lib/auth';
import { prisma } from '@repo/db';
import { redirect } from 'next/navigation';
import {
  Building2, CreditCard, Mail, MessageSquare,
  Save, ChevronRight, CheckCircle, AlertCircle, Zap
} from 'lucide-react';

const inputCls = "w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 bg-white placeholder:text-gray-400";
const labelCls = "block text-xs font-medium text-gray-700 mb-1";
const sectionHeaderCls = "px-6 py-4 border-b border-gray-100 flex items-center gap-3";

function SectionCard({ icon, title, description, badge, children }: {
  icon: React.ReactNode; title: string; description: string; badge?: string; children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className={sectionHeaderCls}>
        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
            {badge && (
              <span className="text-xs font-medium px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full border border-amber-200">
                {badge}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-0.5">{description}</p>
        </div>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      {children}
    </div>
  );
}

function StatusBadge({ active, label }: { active: boolean; label: string }) {
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
      active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
    }`}>
      {active ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
      {label}
    </span>
  );
}

export default async function SettingsPage() {
  const user = await requireAuth();
  const orgId = user.ownedOrgs[0]?.id;

  const [org, emailCfg, waConfig, pgConfigs] = await Promise.all([
    prisma.organization.findUnique({ where: { id: orgId } }),
    prisma.emailConfig.findUnique({ where: { organizationId: orgId } }),
    prisma.whatsAppConfig.findUnique({ where: { organizationId: orgId } }),
    prisma.paymentGatewayConfig.findMany({ where: { organizationId: orgId } }),
  ]);

  if (!org) return null;

  const razorpay = pgConfigs.find(p => p.provider === 'RAZORPAY');
  const paytm = pgConfigs.find(p => p.provider === 'PAYTM');

  async function saveGeneral(fd: FormData) {
    "use server";
    const u = await requireAuth();
    const id = u.ownedOrgs[0]?.id;
    await prisma.organization.update({
      where: { id },
      data: {
        name: fd.get('name') as string,
        gstin: fd.get('gstin') as string || null,
        stateCode: fd.get('stateCode') as string || null,
        address: fd.get('address') as string || null,
        phone: fd.get('phone') as string || null,
        website: fd.get('website') as string || null,
        bankName: fd.get('bankName') as string || null,
        bankAccount: fd.get('bankAccount') as string || null,
        bankIfsc: fd.get('bankIfsc') as string || null,
        defaultTemplate: fd.get('defaultTemplate') as string || 'modern',
        invoicePrefix: fd.get('invoicePrefix') as string || 'INV',
        defaultDueDays: parseInt(fd.get('defaultDueDays') as string) || 30,
      }
    });
    redirect('/dashboard/settings');
  }

  async function saveRazorpay(fd: FormData) {
    "use server";
    const u = await requireAuth();
    const id = u.ownedOrgs[0]?.id;
    const keyId = fd.get('razorpay_key_id') as string;
    const keySecret = fd.get('razorpay_key_secret') as string;
    const webhookSecret = fd.get('razorpay_webhook_secret') as string;
    if (!keyId || !keySecret) { redirect('/dashboard/settings?error=razorpay_missing'); }
    await prisma.paymentGatewayConfig.upsert({
      where: { organizationId_provider: { organizationId: id, provider: 'RAZORPAY' } },
      create: { organizationId: id, provider: 'RAZORPAY', keyId, keySecret, webhookSecret: webhookSecret || null, isActive: true },
      update: { keyId, keySecret, webhookSecret: webhookSecret || null, isActive: true },
    });
    redirect('/dashboard/settings?success=razorpay');
  }

  async function saveEmail(fd: FormData) {
    "use server";
    const u = await requireAuth();
    const id = u.ownedOrgs[0]?.id;
    const provider = fd.get('email_provider') as 'RESEND' | 'SMTP' | 'SENDGRID';
    await prisma.emailConfig.upsert({
      where: { organizationId: id },
      create: {
        organizationId: id, provider,
        apiKey: fd.get('email_api_key') as string || null,
        smtpHost: fd.get('smtp_host') as string || null,
        smtpPort: parseInt(fd.get('smtp_port') as string) || null,
        smtpUser: fd.get('smtp_user') as string || null,
        smtpPass: fd.get('smtp_pass') as string || null,
        fromName: fd.get('from_name') as string || 'Billing',
        fromEmail: fd.get('from_email') as string || '',
      },
      update: {
        provider,
        apiKey: fd.get('email_api_key') as string || null,
        smtpHost: fd.get('smtp_host') as string || null,
        smtpPort: parseInt(fd.get('smtp_port') as string) || null,
        smtpUser: fd.get('smtp_user') as string || null,
        smtpPass: fd.get('smtp_pass') as string || null,
        fromName: fd.get('from_name') as string || 'Billing',
        fromEmail: fd.get('from_email') as string || '',
      },
    });
    redirect('/dashboard/settings?success=email');
  }

  async function saveWhatsApp(fd: FormData) {
    "use server";
    const u = await requireAuth();
    const id = u.ownedOrgs[0]?.id;
    const provider = fd.get('wa_provider') as 'TWILIO' | 'WATI' | 'META_CLOUD';
    await prisma.whatsAppConfig.upsert({
      where: { organizationId: id },
      create: {
        organizationId: id, provider,
        apiKey: fd.get('wa_api_key') as string,
        apiSecret: fd.get('wa_api_secret') as string || null,
        phoneNumberId: fd.get('wa_phone_number_id') as string || null,
        businessNumber: fd.get('wa_business_number') as string,
        isActive: true,
      },
      update: {
        provider,
        apiKey: fd.get('wa_api_key') as string,
        apiSecret: fd.get('wa_api_secret') as string || null,
        phoneNumberId: fd.get('wa_phone_number_id') as string || null,
        businessNumber: fd.get('wa_business_number') as string,
        isActive: true,
      },
    });
    redirect('/dashboard/settings?success=whatsapp');
  }

  return (
    <div className="p-6 max-w-3xl mx-auto w-full">
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500">Manage your business profile and integrations</p>
      </div>

      <div className="space-y-5">
        {/* ── Business & Invoice Settings ── */}
        <form action={saveGeneral}>
          <SectionCard
            icon={<Building2 className="w-4 h-4 text-gray-600" />}
            title="Business & Invoice"
            description="Your public business details and invoice defaults"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Business Name *">
                <input name="name" required defaultValue={org.name} className={inputCls} />
              </Field>
              <Field label="GSTIN">
                <input name="gstin" defaultValue={org.gstin || ''} placeholder="27AAAAA0000A1Z5" className={inputCls} />
              </Field>
              <Field label="State Code">
                <input name="stateCode" defaultValue={org.stateCode || ''} placeholder="27 for Maharashtra" className={inputCls} />
              </Field>
              <Field label="Phone">
                <input name="phone" defaultValue={org.phone || ''} placeholder="+91 98765 43210" className={inputCls} />
              </Field>
              <Field label="Address">
                <input name="address" defaultValue={org.address || ''} placeholder="Your full business address" className={inputCls} />
              </Field>
              <Field label="Website">
                <input name="website" defaultValue={org.website || ''} placeholder="https://yourcompany.com" className={inputCls} />
              </Field>

              <div className="md:col-span-2 pt-2 border-t border-gray-100">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Bank Details (for PDF)</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Field label="Bank Name">
                    <input name="bankName" defaultValue={org.bankName || ''} placeholder="HDFC Bank" className={inputCls} />
                  </Field>
                  <Field label="Account Number">
                    <input name="bankAccount" defaultValue={org.bankAccount || ''} placeholder="XXXX XXXX XXXX" className={inputCls} />
                  </Field>
                  <Field label="IFSC Code">
                    <input name="bankIfsc" defaultValue={org.bankIfsc || ''} placeholder="HDFC0001234" className={inputCls} />
                  </Field>
                </div>
              </div>

              <div className="md:col-span-2 pt-2 border-t border-gray-100">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Invoice Defaults</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Field label="Invoice Prefix">
                    <input name="invoicePrefix" defaultValue={org.invoicePrefix || 'INV'} placeholder="INV" className={inputCls} />
                  </Field>
                  <Field label="Default Due Days">
                    <input name="defaultDueDays" type="number" defaultValue={org.defaultDueDays || 30} className={inputCls} />
                  </Field>
                  <Field label="Default Template">
                    <select name="defaultTemplate" defaultValue={org.defaultTemplate} className={inputCls}>
                      <option value="modern">Modern</option>
                      <option value="classic">Classic</option>
                      <option value="minimal">Minimal</option>
                    </select>
                  </Field>
                </div>
              </div>
            </div>
            <div className="flex justify-end mt-4 pt-4 border-t border-gray-100">
              <button type="submit" className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-700 transition-colors">
                <Save className="w-3.5 h-3.5" /> Save
              </button>
            </div>
          </SectionCard>
        </form>

        {/* ── Razorpay ── */}
        <form action={saveRazorpay}>
          <SectionCard
            icon={<CreditCard className="w-4 h-4 text-gray-600" />}
            title="Razorpay"
            description="Auto-track payments — when a customer pays via Razorpay, invoice status updates automatically"
            badge={razorpay ? undefined : "Not configured"}
          >
            {razorpay && (
              <div className="flex items-center gap-2 mb-4 text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                <CheckCircle className="w-3.5 h-3.5" />
                Connected · Key ID: {razorpay.keyId.slice(0, 8)}••••
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Key ID (rzp_live_••• or rzp_test_•••)">
                <input name="razorpay_key_id" required placeholder="rzp_test_xxxxxxxxxx" defaultValue={razorpay?.keyId || ''} className={inputCls} />
              </Field>
              <Field label="Key Secret">
                <input name="razorpay_key_secret" required type="password" placeholder="••••••••••••••••" defaultValue={razorpay?.keySecret || ''} className={inputCls} />
              </Field>
              <Field label="Webhook Secret (for auto payment tracking)">
                <input name="razorpay_webhook_secret" type="password" placeholder="From Razorpay Dashboard → Webhooks" defaultValue={razorpay?.webhookSecret || ''} className={inputCls} />
              </Field>
              <div className="flex flex-col justify-end">
                <p className="text-xs text-gray-500 leading-relaxed">
                  Add webhook URL in Razorpay Dashboard:<br />
                  <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-700 break-all">
                    https://yourdomain.com/api/webhooks/razorpay
                  </code>
                </p>
              </div>
            </div>
            <div className="flex justify-end mt-4 pt-4 border-t border-gray-100">
              <button type="submit" className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-700 transition-colors">
                <Save className="w-3.5 h-3.5" /> {razorpay ? 'Update' : 'Connect Razorpay'}
              </button>
            </div>
          </SectionCard>
        </form>

        {/* ── Paytm placeholder ── */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden opacity-60">
          <div className={sectionHeaderCls}>
            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <CreditCard className="w-4 h-4 text-gray-400" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-gray-600">Paytm / Cashfree / Stripe</h2>
                <span className="text-xs font-medium px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full border border-indigo-200">Coming soon</span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">More payment gateways will be added soon</p>
            </div>
          </div>
        </div>

        {/* ── Email ── */}
        <form action={saveEmail}>
          <SectionCard
            icon={<Mail className="w-4 h-4 text-gray-600" />}
            title="Email Delivery"
            description="Send invoices and payment receipts directly via email"
            badge={emailCfg ? undefined : "Not configured"}
          >
            {emailCfg && (
              <div className="flex items-center gap-2 mb-4 text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                <CheckCircle className="w-3.5 h-3.5" />
                Configured · From: {emailCfg.fromEmail} · Provider: {emailCfg.provider}
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Email Provider">
                <select name="email_provider" defaultValue={emailCfg?.provider || 'RESEND'} className={inputCls}>
                  <option value="RESEND">Resend (recommended)</option>
                  <option value="SENDGRID">SendGrid</option>
                  <option value="SMTP">SMTP</option>
                </select>
              </Field>
              <Field label="API Key (Resend / SendGrid)">
                <input name="email_api_key" type="password" placeholder="re_••••••" defaultValue={emailCfg?.apiKey || ''} className={inputCls} />
              </Field>
              <Field label="From Name">
                <input name="from_name" placeholder="Acme Billing" defaultValue={emailCfg?.fromName || org.name} className={inputCls} />
              </Field>
              <Field label="From Email">
                <input name="from_email" type="email" placeholder="billing@yourcompany.com" defaultValue={emailCfg?.fromEmail || ''} className={inputCls} />
              </Field>
              <div className="md:col-span-2">
                <p className="text-xs text-gray-500 bg-gray-50 rounded-md px-3 py-2 border border-gray-200">
                  <strong>SMTP:</strong> Fill Host, Port, User, Password below. Leave API Key blank.
                </p>
              </div>
              <Field label="SMTP Host">
                <input name="smtp_host" placeholder="smtp.gmail.com" defaultValue={emailCfg?.smtpHost || ''} className={inputCls} />
              </Field>
              <Field label="SMTP Port">
                <input name="smtp_port" type="number" placeholder="587" defaultValue={emailCfg?.smtpPort || ''} className={inputCls} />
              </Field>
              <Field label="SMTP User">
                <input name="smtp_user" placeholder="you@gmail.com" defaultValue={emailCfg?.smtpUser || ''} className={inputCls} />
              </Field>
              <Field label="SMTP Password">
                <input name="smtp_pass" type="password" placeholder="••••••••" defaultValue={emailCfg?.smtpPass || ''} className={inputCls} />
              </Field>
            </div>
            <div className="flex justify-end mt-4 pt-4 border-t border-gray-100">
              <button type="submit" className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-700 transition-colors">
                <Save className="w-3.5 h-3.5" /> {emailCfg ? 'Update' : 'Save Email Config'}
              </button>
            </div>
          </SectionCard>
        </form>

        {/* ── WhatsApp ── */}
        <form action={saveWhatsApp}>
          <SectionCard
            icon={<MessageSquare className="w-4 h-4 text-gray-600" />}
            title="WhatsApp Delivery"
            description="Send invoices and payment links directly via WhatsApp"
            badge={waConfig ? undefined : "Not configured"}
          >
            {waConfig && (
              <div className="flex items-center gap-2 mb-4 text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                <CheckCircle className="w-3.5 h-3.5" />
                Connected · Number: {waConfig.businessNumber} · Provider: {waConfig.provider}
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Provider">
                <select name="wa_provider" defaultValue={waConfig?.provider || 'TWILIO'} className={inputCls}>
                  <option value="TWILIO">Twilio (easiest to set up)</option>
                  <option value="WATI">WATI</option>
                  <option value="META_CLOUD">Meta Cloud API</option>
                </select>
              </Field>
              <Field label="Business WhatsApp Number">
                <input name="wa_business_number" placeholder="+919876543210" defaultValue={waConfig?.businessNumber || ''} className={inputCls} />
              </Field>
              <Field label="API Key / Account SID">
                <input name="wa_api_key" type="password" placeholder="••••••••" defaultValue={waConfig?.apiKey || ''} className={inputCls} />
              </Field>
              <Field label="Auth Token / API Secret">
                <input name="wa_api_secret" type="password" placeholder="••••••••" defaultValue={waConfig?.apiSecret || ''} className={inputCls} />
              </Field>
              <Field label="Phone Number ID (Meta Cloud API only)">
                <input name="wa_phone_number_id" placeholder="From Meta Business Dashboard" defaultValue={waConfig?.phoneNumberId || ''} className={inputCls} />
              </Field>
            </div>
            <div className="flex justify-end mt-4 pt-4 border-t border-gray-100">
              <button type="submit" className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-700 transition-colors">
                <Save className="w-3.5 h-3.5" /> {waConfig ? 'Update' : 'Save WhatsApp Config'}
              </button>
            </div>
          </SectionCard>
        </form>

        {/* ── MCP / API Access ── */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className={sectionHeaderCls}>
            <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <Zap className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-gray-900">API & MCP Access</h2>
                <span className="text-xs font-medium px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full border border-indigo-200">Coming soon</span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">Let AI agents create invoices, check payment status, and send reminders on your behalf</p>
            </div>
          </div>
          <div className="p-6">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-600">
              <p className="font-medium text-gray-900 mb-1">🤖 Coming: MCP Connectivity</p>
              <p className="text-xs text-gray-500 leading-relaxed">
                Once enabled, your AI assistant (Claude, GPT, Cursor) can directly:
                create invoices, check who owes you, send payment reminders — all via natural language commands.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
