"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Download, Send, IndianRupee, X, Loader2,
  CheckCircle2, AlertCircle, Clock, Link2, Mail, MessageSquare,
} from "lucide-react";

type InvoiceStatus = "DRAFT" | "SENT" | "PARTIALLY_PAID" | "PAID" | "OVERDUE" | "CANCELLED";

// ─── Template Preview Cards ──────────────────────────────────────────
const TEMPLATES = [
  {
    id: "modern",
    name: "Modern",
    desc: "Dark header, clean layout",
    preview: (
      <div className="w-full h-28 bg-white border border-gray-200 rounded-lg overflow-hidden flex flex-col shadow-sm">
        <div className="h-8 bg-gray-900 w-full flex items-center px-3">
          <div className="h-2 bg-white/70 w-20 rounded" />
          <div className="ml-auto h-2 bg-white/40 w-12 rounded" />
        </div>
        <div className="flex-1 p-3 space-y-1.5">
          <div className="h-1.5 bg-gray-200 w-2/3 rounded" />
          <div className="h-1.5 bg-gray-100 w-1/3 rounded" />
          <div className="mt-2 h-px bg-gray-100 w-full" />
          <div className="h-1.5 bg-gray-200 w-full rounded" />
          <div className="h-1.5 bg-gray-200 w-5/6 rounded" />
          <div className="flex justify-end mt-1">
            <div className="h-2 bg-gray-800 w-16 rounded" />
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "classic",
    name: "Classic",
    desc: "Traditional, double-bordered",
    preview: (
      <div className="w-full h-28 bg-white border-2 border-gray-800 rounded-lg overflow-hidden flex flex-col shadow-sm">
        <div className="p-2.5 border-b-2 border-gray-800 flex justify-between items-center">
          <div className="h-2.5 bg-gray-800 w-16 rounded" />
          <div className="text-right">
            <div className="h-1.5 bg-gray-300 w-10 rounded mb-1" />
            <div className="h-1.5 bg-gray-200 w-12 rounded" />
          </div>
        </div>
        <div className="flex-1 p-2.5 space-y-1.5">
          <div className="h-1.5 bg-gray-200 w-full rounded" />
          <div className="h-1.5 bg-gray-200 w-5/6 rounded" />
          <div className="flex justify-end mt-1">
            <div className="h-2 bg-gray-800 w-14 rounded" />
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "minimal",
    name: "Minimal",
    desc: "Clean, typography-first",
    preview: (
      <div className="w-full h-28 bg-white border border-gray-100 rounded-lg overflow-hidden flex flex-col p-3 shadow-sm space-y-1.5">
        <div className="text-xs font-bold text-gray-200 text-right tracking-widest">INVOICE</div>
        <div className="h-2.5 bg-gray-900 w-1/3 rounded" />
        <div className="h-px bg-gray-200 w-full" />
        <div className="h-1.5 bg-gray-100 w-3/4 rounded" />
        <div className="h-1.5 bg-gray-100 w-full rounded" />
        <div className="h-1.5 bg-gray-100 w-2/3 rounded" />
        <div className="flex justify-end">
          <div className="h-2 bg-gray-700 w-16 rounded" />
        </div>
      </div>
    ),
  },
];

// ─── Template Picker Modal ───────────────────────────────────────────
function TemplatePicker({
  currentTemplate,
  onDownload,
  onClose,
}: {
  currentTemplate: string;
  onDownload: (template: string) => Promise<void>;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState(currentTemplate);
  const [loading, setLoading] = useState(false);

  const go = async () => {
    setLoading(true);
    await onDownload(selected);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-in">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card rounded-xl shadow-xl w-full max-w-lg mx-4 p-6 border border-border">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Choose Invoice Template</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Select a design for your PDF</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
        </div>
        <div className="grid grid-cols-3 gap-3 mb-5">
          {TEMPLATES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setSelected(t.id)}
              className={`text-left rounded-xl p-3 border-2 transition-all ${
                selected === t.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
              }`}
            >
              {t.preview}
              <p className="mt-2.5 text-xs font-semibold text-foreground">{t.name}</p>
              <p className="text-xs text-muted-foreground">{t.desc}</p>
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={onClose}
            className="flex-1 py-2 text-sm border border-border rounded-xl text-foreground hover:bg-secondary">
            Cancel
          </button>
          <button onClick={go} disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 py-2 text-sm bg-primary text-primary-foreground rounded-xl hover:opacity-90 disabled:opacity-60 font-bold">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Download PDF
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Payment Modal ───────────────────────────────────────────────────
function PaymentModal({
  invoiceId, total, paid, onClose, onSuccess,
}: {
  invoiceId: string; total: number; paid: number;
  onClose: () => void; onSuccess: (newStatus: string) => void;
}) {
  const remaining = total - paid;
  const pct = total > 0 ? Math.round((paid / total) * 100) : 0;
  const [amount, setAmount] = useState(remaining.toFixed(2));
  const [method, setMethod] = useState("UPI");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const METHODS = ["UPI", "Bank Transfer", "Cash", "Cheque", "Credit Card"];

  const setQuickAmount = (fraction: number) =>
    setAmount((remaining * fraction).toFixed(2));

  const handleSubmit = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0 || amt > remaining + 0.01) {
      setErr(`Amount must be between ₹0.01 and ₹${remaining.toFixed(2)}`);
      return;
    }
    setLoading(true);
    setErr("");
    const res = await fetch(`/api/invoices/${invoiceId}/payment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: amt, method, notes }),
    });
    const data = await res.json();
    if (!res.ok) { setErr(data.error || "Failed to record payment"); setLoading(false); return; }
    setLoading(false);
    onSuccess(data.newStatus);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-in">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card rounded-2xl shadow-xl w-full max-w-sm mx-4 border border-border">
        {/* Header */}
        <div className="p-5 border-b border-border">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Record Payment</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Mark full or partial payment received</p>
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
          </div>
        </div>

        {/* Balance summary */}
        <div className="px-5 pt-4 pb-3">
          <div className="bg-secondary/50 rounded-xl p-4">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Invoice Total</span><span>₹{total.toFixed(2)}</span>
            </div>
            {paid > 0 && (
              <div className="flex justify-between text-xs text-green-600 mb-1">
                <span>Already Paid</span><span>— ₹{paid.toFixed(2)}</span>
              </div>
            )}
            {/* Progress bar */}
            {paid > 0 && (
              <div className="w-full bg-border rounded-full h-1.5 my-2">
                <div className="bg-green-500 h-1.5 rounded-full transition-all" style={{ width: `${pct}%` }} />
              </div>
            )}
            <div className="flex justify-between text-sm font-semibold text-foreground mt-1 pt-2 border-t border-border">
              <span>Balance Due</span><span>₹{remaining.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="px-5 pb-5 space-y-4">
          {err && <p className="text-xs text-destructive bg-destructive/10 px-3 py-2 rounded-lg border border-destructive/20">{err}</p>}

          {/* Quick amount buttons */}
          <div>
            <label className="text-xs font-bold text-muted-foreground mb-2 block uppercase tracking-wider">Amount (₹)</label>
            <div className="flex gap-2 mb-2">
              <button type="button" onClick={() => setQuickAmount(1)}
                className="flex-1 py-1.5 text-xs border border-border rounded-xl hover:bg-secondary font-bold transition-all">
                Pay Full
              </button>
              <button type="button" onClick={() => setQuickAmount(0.5)}
                className="flex-1 py-1.5 text-xs border border-border rounded-xl hover:bg-secondary transition-all">
                Pay 50%
              </button>
            </div>
            <input
              type="number" step="0.01" min="0.01" max={remaining}
              value={amount} onChange={(e) => setAmount(e.target.value)}
              className="w-full border border-border bg-background rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-bold"
            />
          </div>

          {/* Payment method pills */}
          <div>
            <label className="text-xs font-bold text-muted-foreground mb-2 block uppercase tracking-wider">Payment Method</label>
            <div className="flex flex-wrap gap-2">
              {METHODS.map((m) => (
                <button key={m} type="button" onClick={() => setMethod(m)}
                  className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-full border transition-all ${
                    method === m
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Optional note */}
          <div>
            <label className="text-xs font-bold text-muted-foreground mb-1 block uppercase tracking-wider">Reference / Note</label>
            <input
              value={notes} onChange={(e) => setNotes(e.target.value)}
              placeholder="UTR no., cheque no., etc."
              className="w-full border border-border bg-background rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          <button onClick={handleSubmit} disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 text-sm font-bold bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-all shadow-lg shadow-primary/20 disabled:opacity-60">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <IndianRupee className="w-4 h-4" />}
            {parseFloat(amount) >= remaining ? "Mark as Fully Paid" : "Record Partial Payment"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Status helpers ──────────────────────────────────────────────────
const STATUS_CONFIG: Record<InvoiceStatus, { label: string; cls: string; icon: React.ReactNode }> = {
  DRAFT:          { label: "Draft",          cls: "bg-gray-100 text-gray-600",   icon: <Clock className="w-3 h-3" /> },
  SENT:           { label: "Sent",           cls: "bg-blue-50 text-blue-700",    icon: <Send className="w-3 h-3" /> },
  PARTIALLY_PAID: { label: "Part. Paid",     cls: "bg-amber-50 text-amber-700",  icon: <AlertCircle className="w-3 h-3" /> },
  PAID:           { label: "Paid",           cls: "bg-green-50 text-green-700",  icon: <CheckCircle2 className="w-3 h-3" /> },
  OVERDUE:        { label: "Overdue",        cls: "bg-red-50 text-red-700",      icon: <AlertCircle className="w-3 h-3" /> },
  CANCELLED:      { label: "Cancelled",      cls: "bg-gray-100 text-gray-400",   icon: <X className="w-3 h-3" /> },
};

// ─── Main Export ─────────────────────────────────────────────────────
export default function InvoiceActions({
  invoiceId, status, total, paid, defaultTemplate,
}: {
  invoiceId: string;
  status: InvoiceStatus;
  total: number;
  paid: number;
  defaultTemplate: string;
}) {
  const router = useRouter();
  const [currentStatus, setCurrentStatus] = useState<InvoiceStatus>(status);
  const [showPayment, setShowPayment] = useState(false);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [generatingLink, setGeneratingLink] = useState(false);
  const [paymentLinkUrl, setPaymentLinkUrl] = useState<string | null>(null);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [sendingWhatsApp, setSendingWhatsApp] = useState(false);
  const [whatsAppSent, setWhatsAppSent] = useState(false);

  const cfg = STATUS_CONFIG[currentStatus];

  const downloadPDF = async (template: string) => {
    const res = await fetch(`/api/invoices/${invoiceId}/pdf?template=${template}`);
    if (!res.ok) { alert("PDF generation failed"); return; }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `invoice-${invoiceId}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
    setShowTemplatePicker(false);
  };

  const generatePaymentLink = async () => {
    setGeneratingLink(true);
    const res = await fetch(`/api/invoices/${invoiceId}/payment-link`, { method: "POST" });
    const data = await res.json();
    if (!res.ok) { alert(data.error || "Failed to generate payment link"); setGeneratingLink(false); return; }
    if (data.shortUrl) setPaymentLinkUrl(data.shortUrl);
    if (!data.alreadyExists) setCurrentStatus("SENT");
    setGeneratingLink(false);
    navigator.clipboard.writeText(data.shortUrl).catch(() => {});
  };

  const sendEmail = async () => {
    setSendingEmail(true);
    const res = await fetch(`/api/invoices/${invoiceId}/send-email`, { method: "POST" });
    const data = await res.json();
    if (!res.ok) { alert(data.error || "Failed to send email"); setSendingEmail(false); return; }
    setEmailSent(true);
    setSendingEmail(false);
    setTimeout(() => setEmailSent(false), 4000);
  };

  const sendWhatsApp = async () => {
    setSendingWhatsApp(true);
    const res = await fetch(`/api/invoices/${invoiceId}/send-whatsapp`, { method: "POST" });
    const data = await res.json();
    if (!res.ok) { alert(data.error || "Failed to send WhatsApp"); setSendingWhatsApp(false); return; }
    
    if (data.fallback && data.url) {
      window.open(data.url, "_blank");
    }
    
    setWhatsAppSent(true);
    setSendingWhatsApp(false);
    setTimeout(() => setWhatsAppSent(false), 4000);
  };

  const remaining = total - paid;

  return (
    <>
      {showTemplatePicker && (
        <TemplatePicker
          currentTemplate={defaultTemplate}
          onDownload={downloadPDF}
          onClose={() => setShowTemplatePicker(false)}
        />
      )}
      {showPayment && (
        <PaymentModal
          invoiceId={invoiceId}
          total={total}
          paid={paid}
          onClose={() => setShowPayment(false)}
          onSuccess={(newStatus) => {
            setCurrentStatus(newStatus as InvoiceStatus);
            setShowPayment(false);
            router.refresh();
          }}
        />
      )}

      <div className="flex items-center gap-2 flex-wrap">
        {/* Status badge */}
        <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${cfg.cls}`}>
          {cfg.icon}{cfg.label}
        </span>

        {/* Generate Razorpay payment link */}
        {currentStatus !== "PAID" && currentStatus !== "CANCELLED" && (
          <button onClick={generatePaymentLink} disabled={generatingLink}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-border text-xs text-foreground rounded-xl hover:bg-secondary transition-all disabled:opacity-60 font-bold">
            {generatingLink ? <Loader2 className="w-3 h-3 animate-spin" /> : <Link2 className="w-3 h-3" />}
            {paymentLinkUrl ? "Link Copied ✓" : "Payment Link"}
          </button>
        )}

        {/* Send email */}
        <button onClick={sendEmail} disabled={sendingEmail || emailSent}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-border text-xs text-foreground rounded-xl hover:bg-secondary transition-all disabled:opacity-60 font-bold">
          {sendingEmail ? <Loader2 className="w-3 h-3 animate-spin" /> : <Mail className="w-3 h-3" />}
          {emailSent ? "Email Sent ✓" : "Send Email"}
        </button>

        {/* Send WhatsApp */}
        <button onClick={sendWhatsApp} disabled={sendingWhatsApp || whatsAppSent}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-border text-xs text-foreground rounded-xl hover:bg-secondary transition-all disabled:opacity-60 font-bold">
          {sendingWhatsApp ? <Loader2 className="w-3 h-3 animate-spin" /> : <MessageSquare className="w-3 h-3 text-green-600" />}
          {whatsAppSent ? "WA Sent ✓" : "WhatsApp"}
        </button>

        {(currentStatus === "DRAFT" || currentStatus === "SENT" || currentStatus === "PARTIALLY_PAID" || currentStatus === "OVERDUE") && remaining > 0 && (
          <button onClick={() => setShowPayment(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-border text-xs text-foreground rounded-xl hover:bg-secondary transition-all font-bold">
            <IndianRupee className="w-3 h-3 text-primary" />
            Record Payment
            {remaining < total && <span className="text-muted-foreground ml-1 font-normal">· ₹{remaining.toFixed(0)} balance</span>}
          </button>
        )}

        {currentStatus === "PAID" && (
          <span className="flex items-center gap-1.5 text-xs text-green-600 font-bold px-3 py-1.5 bg-green-500/10 rounded-xl border border-green-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Fully Paid
          </span>
        )}

        <button onClick={() => setShowTemplatePicker(true)}
          className="flex items-center gap-1.5 px-4 py-1.5 bg-primary text-primary-foreground text-xs font-bold rounded-xl hover:opacity-90 transition-all shadow-lg shadow-primary/20">
          <Download className="w-3.5 h-3.5" />
          Download PDF
        </button>
      </div>
    </>
  );
}
