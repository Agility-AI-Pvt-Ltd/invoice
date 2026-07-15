"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { computeInvoiceTotals } from "../../../../../../lib/gst";
import { toRupees } from "@/lib/money";

type Customer = { id: string; name: string; stateCode: string | null };
type LineItem = {
  id: string;
  description: string;
  hsnCode: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
};

export type RecurringInvoiceData = {
  id: string;
  title: string | null;
  interval: string;
  nextIssueDate: Date;
  endDate: Date | null;
  dueDays: number;
  autoSend: boolean;
  notes: string | null;
  items: Array<{
    id: string;
    description: string;
    hsnCode: string | null;
    quantity: number;
    unitPrice: number;
    taxRate: number;
  }>;
  customerId: string;
  customer: Customer;
};

export default function EditRecurringForm({
  recurring,
  customers,
  orgStateCode,
}: {
  recurring: RecurringInvoiceData;
  customers: Customer[];
  orgStateCode: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [success, setSuccess] = useState(false);

  const [selectedCustomerId, setSelectedCustomerId] = useState(recurring.customerId);
  const [title, setTitle] = useState(recurring.title || "");
  const [interval, setInterval] = useState(recurring.interval as string);
  const [nextIssueDate, setNextIssueDate] = useState(recurring.nextIssueDate.toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(
    recurring.endDate ? recurring.endDate.toISOString().slice(0, 10) : ""
  );
  const [dueDays, setDueDays] = useState(recurring.dueDays);
  const [autoSend, setAutoSend] = useState(recurring.autoSend);
  const [notes, setNotes] = useState(recurring.notes || "");
  const [items, setItems] = useState<LineItem[]>(
    recurring.items.map((item) => ({
      id: item.id,
      description: item.description,
      hsnCode: item.hsnCode || "",
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      taxRate: item.taxRate,
    }))
  );

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);
  const isInterState = selectedCustomer && orgStateCode ? orgStateCode !== selectedCustomer.stateCode : false;

  const totals = useMemo(() => {
    const itemsForCalc = items.map((item) => ({
      description: item.description,
      hsnCode: item.hsnCode,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      taxRate: item.taxRate,
    }));
    return computeInvoiceTotals(itemsForCalc, isInterState);
  }, [items, isInterState]);

  const addItem = () => {
    setItems([
      ...items,
      {
        id: Date.now().toString(),
        description: "",
        hsnCode: "",
        quantity: 1,
        unitPrice: 0,
        taxRate: 18,
      },
    ]);
  };

  const removeItem = (lineId: string) => {
    setItems(items.filter((item) => item.id !== lineId));
  };

  const updateItem = (lineId: string, field: string, value: unknown) => {
    setItems(items.map((item) => (item.id === lineId ? { ...item, [field]: value } : item)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId) {
      setErr("Please select a customer");
      return;
    }
    if (items.some((item) => !item.description.trim())) {
      setErr("All items must have a description");
      return;
    }

    setLoading(true);
    setErr("");

    try {
      const res = await fetch(`/api/recurring/${recurring.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: selectedCustomerId,
          title: title || null,
          interval,
          nextIssueDate,
          endDate: endDate || null,
          dueDays,
          autoSend,
          notes: notes || null,
          items: items.map((item) => ({
            description: item.description,
            hsnCode: item.hsnCode || null,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            taxRate: item.taxRate,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErr(data.error || "Failed to update subscription");
        setLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => router.push(`/dashboard/recurring/${recurring.id}`), 1500);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "An error occurred");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {err && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3 flex items-start gap-3 text-sm text-destructive">
          <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <div>{err}</div>
        </div>
      )}

      {success && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3 flex items-start gap-3 text-sm text-green-600">
          <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <div>Subscription updated successfully!</div>
        </div>
      )}

      <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Subscriber</h3>
        <select
          value={selectedCustomerId}
          onChange={(e) => setSelectedCustomerId(e.target.value)}
          className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        >
          <option value="">Select a customer...</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Schedule Details</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wider">
              Title (Optional)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Monthly SaaS Billing"
              className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wider">Frequency</label>
            <div className="flex gap-2">
              {(["WEEKLY", "MONTHLY", "QUARTERLY", "YEARLY"] as const).map((freq) => (
                <button
                  key={freq}
                  type="button"
                  onClick={() => setInterval(freq)}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all ${
                    interval === freq
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  {freq}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wider">
              Next Invoice Date
            </label>
            <input
              type="date"
              value={nextIssueDate}
              onChange={(e) => setNextIssueDate(e.target.value)}
              className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wider">
              End Date (Optional)
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wider">Due Days</label>
            <input
              type="number"
              value={dueDays}
              onChange={(e) => setDueDays(Math.max(1, parseInt(e.target.value, 10) || 0))}
              min={1}
              className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer w-full">
              <input
                type="checkbox"
                checked={autoSend}
                onChange={(e) => setAutoSend(e.target.checked)}
                className="w-4 h-4 rounded border-border"
              />
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Auto-send email</span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wider">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any additional notes for the customer..."
            rows={2}
            className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
          />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Line Items</h3>

        <div className="space-y-3 max-h-96 overflow-y-auto">
          {items.map((item) => (
            <div key={item.id} className="flex gap-3 items-end pb-3 border-b border-border last:border-0">
              <div className="flex-1">
                <label className="block text-[10px] font-bold text-muted-foreground mb-1 uppercase tracking-widest">
                  Description
                </label>
                <input
                  type="text"
                  value={item.description}
                  onChange={(e) => updateItem(item.id, "description", e.target.value)}
                  placeholder="Item description"
                  className="w-full bg-background border border-border rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="w-20">
                <label className="block text-[10px] font-bold text-muted-foreground mb-1 uppercase tracking-widest">
                  HSN
                </label>
                <input
                  type="text"
                  value={item.hsnCode}
                  onChange={(e) => updateItem(item.id, "hsnCode", e.target.value)}
                  placeholder="9983"
                  className="w-full bg-background border border-border rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="w-16">
                <label className="block text-[10px] font-bold text-muted-foreground mb-1 uppercase tracking-widest">
                  Qty
                </label>
                <input
                  type="number"
                  value={item.quantity}
                  onChange={(e) => updateItem(item.id, "quantity", parseFloat(e.target.value) || 1)}
                  step="0.01"
                  min="0.01"
                  className="w-full bg-background border border-border rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="w-24">
                <label className="block text-[10px] font-bold text-muted-foreground mb-1 uppercase tracking-widest">
                  Price
                </label>
                <input
                  type="number"
                  value={item.unitPrice}
                  onChange={(e) => updateItem(item.id, "unitPrice", parseFloat(e.target.value) || 0)}
                  step="0.01"
                  min="0"
                  className="w-full bg-background border border-border rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="w-16">
                <label className="block text-[10px] font-bold text-muted-foreground mb-1 uppercase tracking-widest">
                  Tax %
                </label>
                <input
                  type="number"
                  value={item.taxRate}
                  onChange={(e) => updateItem(item.id, "taxRate", parseFloat(e.target.value) || 0)}
                  min="0"
                  max="100"
                  step="0.1"
                  className="w-full bg-background border border-border rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <button
                type="button"
                onClick={() => removeItem(item.id)}
                disabled={items.length === 1}
                className="p-1.5 hover:bg-destructive/10 rounded-lg transition-colors text-destructive disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addItem}
          className="w-full flex items-center justify-center gap-2 py-2 text-sm font-bold border border-border rounded-xl hover:bg-secondary transition-all text-muted-foreground"
        >
          <Plus className="w-4 h-4" />
          Add Item
        </button>
      </div>

      <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Subtotal</p>
            <p className="text-lg font-black text-foreground">
              ₹{toRupees(totals.subTotal).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </p>
          </div>
          {!isInterState && (
            <>
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">CGST</p>
                <p className="text-lg font-black text-foreground">
                  ₹{toRupees(totals.cgstTotal).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">SGST</p>
                <p className="text-lg font-black text-foreground">
                  ₹{toRupees(totals.sgstTotal).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </p>
              </div>
            </>
          )}
          {isInterState && (
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">IGST</p>
              <p className="text-lg font-black text-foreground">
                ₹{toRupees(totals.igstTotal).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </p>
            </div>
          )}
          <div className="col-span-2 md:col-span-1 text-right">
            <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1">Total</p>
            <p className="text-2xl font-black text-primary">
              ₹{toRupees(totals.grandTotal).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex-1 py-3 text-sm font-bold border border-border rounded-xl hover:bg-secondary transition-all text-foreground"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || success}
          className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-all shadow-lg shadow-primary/20 disabled:opacity-60"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {success ? "Updated!" : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
