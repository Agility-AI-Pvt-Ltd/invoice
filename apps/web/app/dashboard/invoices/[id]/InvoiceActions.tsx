"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Download, Send, IndianRupee, X, Loader2,
  CheckCircle2, AlertCircle, Clock, FileCheck,
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
  onDownload: (template: string) => void;
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
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Choose Invoice Template</h2>
            <p className="text-xs text-gray-500 mt-0.5">Select a design for your PDF</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
        </div>
        <div className="grid grid-cols-3 gap-3 mb-5">
          {TEMPLATES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setSelected(t.id)}
              className={`text-left rounded-xl p-3 border-2 transition-all ${
                selected === t.id ? "border-gray-900 bg-gray-50" : "border-gray-200 hover:border-gray-300"
              }`}
            >
              {t.preview}
              <p className="mt-2.5 text-xs font-semibold text-gray-900">{t.name}</p>
              <p className="text-xs text-gray-400">{t.desc}</p>
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={onClose}
            className="flex-1 py-2 text-sm border border-gray-200 rounded-md text-gray-700 hover:bg-gray-50">
            Cancel
          </button>
          <button onClick={go} disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 py-2 text-sm bg-gray-900 text-white rounded-md hover:bg-gray-700 disabled:opacity-60">
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
    if (!amt || amt <= 0 || amt > remaining) {
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
    if (!res.ok) { setErr(data.error); setLoading(false); return; }
    onSuccess(data.newStatus);
  };

  const pct = Math.min((paid / total) * 100, 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/25 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-sm mx-4">
        {/* Header */}
        <div className="p-5 border-b border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Record Payment</h2>
              <p className="text-xs text-gray-500 mt-0.5">Mark full or partial payment received</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
          </div>
        </div>

        {/* Balance summary */}
        <div className="px-5 pt-4 pb-3">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Invoice Total</span><span>₹{total.toFixed(2)}</span>
            </div>
            {paid > 0 && (
              <div className="flex justify-between text-xs text-green-600 mb-1">
                <span>Already Paid</span><span>— ₹{paid.toFixed(2)}</span>
              </div>
            )}
            {/* Progress bar */}
            {paid > 0 && (
              <div className="w-full bg-gray-200 rounded-full h-1.5 my-2">
                <div className="bg-green-500 h-1.5 rounded-full transition-all" style={{ width: `${pct}%` }} />
              </div>
            )}
            <div className="flex justify-between text-sm font-semibold text-gray-900 mt-1 pt-2 border-t border-gray-200">
              <span>Balance Due</span><span>₹{remaining.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="px-5 pb-5 space-y-4">
          {err && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-md">{err}</p>}

          {/* Quick amount buttons */}
          <div>
            <label className="text-xs text-gray-500 mb-2 block">Amount (₹)</label>
            <div className="flex gap-2 mb-2">
              <button type="button" onClick={() => setQuickAmount(1)}
                className="flex-1 py-1.5 text-xs border border-gray-200 rounded-md hover:bg-gray-50 font-medium transition-colors">
                Pay Full
              </button>
              <button type="button" onClick={() => setQuickAmount(0.5)}
                className="flex-1 py-1.5 text-xs border border-gray-200 rounded-md hover:bg-gray-50 transition-colors">
                Pay 50%
              </button>
              <button type="button" onClick={() => setQuickAmount(0.25)}
                className="flex-1 py-1.5 text-xs border border-gray-200 rounded-md hover:bg-gray-50 transition-colors">
                Pay 25%
              </button>
            </div>
            <input
              type="number" step="0.01" min="0.01" max={remaining}
              value={amount} onChange={(e) => setAmount(e.target.value)}
              className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 font-medium"
            />
          </div>

          {/* Payment method pills */}
          <div>
            <label className="text-xs text-gray-500 mb-2 block">Payment Method</label>
            <div className="flex flex-wrap gap-2">
              {METHODS.map((m) => (
                <button key={m} type="button" onClick={() => setMethod(m)}
                  className={`px-3 py-1.5 text-xs rounded-full border transition-all ${
                    method === m
                      ? "bg-gray-900 text-white border-gray-900"
                      : "border-gray-200 text-gray-600 hover:border-gray-400"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Optional note */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Reference / Note <span className="text-gray-400">(optional)</span></label>
            <input
              value={notes} onChange={(e) => setNotes(e.target.value)}
              placeholder="UTR no., cheque no., etc."
              className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
            />
          </div>

          <button onClick={handleSubmit} disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 text-sm bg-gray-900 text-white rounded-md hover:bg-gray-700 transition-colors disabled:opacity-60">
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
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  const cfg = STATUS_CONFIG[currentStatus];

  const updateStatus = async (newStatus: string) => {
    setUpdatingStatus(newStatus);
    const res = await fetch(`/api/invoices/${invoiceId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) setCurrentStatus(newStatus as InvoiceStatus);
    setUpdatingStatus(null);
  };

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

        {currentStatus === "DRAFT" && (
          <button onClick={() => updateStatus("SENT")} disabled={updatingStatus === "SENT"}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 text-xs text-gray-700 rounded-md hover:bg-gray-50 transition-colors">
            {updatingStatus === "SENT" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
            Mark Sent
          </button>
        )}

        {(currentStatus === "SENT" || currentStatus === "PARTIALLY_PAID" || currentStatus === "OVERDUE") && remaining > 0 && (
          <button onClick={() => setShowPayment(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 text-xs text-gray-700 rounded-md hover:bg-gray-50 transition-colors">
            <IndianRupee className="w-3 h-3" />
            Record Payment
            {remaining < total && <span className="text-gray-400 ml-0.5">· ₹{remaining.toFixed(0)} left</span>}
          </button>
        )}

        {currentStatus === "PAID" && (
          <span className="flex items-center gap-1.5 text-xs text-green-700 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Fully paid
          </span>
        )}

        <button onClick={() => setShowTemplatePicker(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-md hover:bg-gray-700 transition-colors">
          <Download className="w-3.5 h-3.5" />
          Download PDF
        </button>
      </div>
    </>
  );
}
