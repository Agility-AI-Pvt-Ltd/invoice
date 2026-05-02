"use client";

import { useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, X, Loader2, UserPlus } from "lucide-react";

type Customer = { id: string; name: string; stateCode: string | null };
type Product = { id: string; name: string; price: number; hsnCode: string | null; taxRate: number };
type LineItem = {
  id: string;
  description: string;
  hsnCode: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
};

const TEMPLATES = [
  {
    id: "modern",
    name: "Modern",
    desc: "Clean header with accent strip",
    preview: (
      <div className="w-full h-20 bg-white border border-gray-200 rounded overflow-hidden flex flex-col">
        <div className="h-4 bg-gray-900 w-full" />
        <div className="flex-1 p-1.5 space-y-1">
          <div className="h-1.5 bg-gray-200 w-3/4 rounded" />
          <div className="h-1.5 bg-gray-100 w-1/2 rounded" />
          <div className="mt-1 h-1.5 bg-gray-200 w-full rounded" />
          <div className="h-1.5 bg-gray-200 w-full rounded" />
        </div>
      </div>
    ),
  },
  {
    id: "classic",
    name: "Classic",
    desc: "Traditional bordered layout",
    preview: (
      <div className="w-full h-20 bg-white border-2 border-gray-800 rounded overflow-hidden flex flex-col">
        <div className="p-1.5 border-b-2 border-gray-800">
          <div className="h-2 bg-gray-800 w-1/3 rounded" />
        </div>
        <div className="flex-1 p-1.5 space-y-1">
          <div className="h-1.5 bg-gray-200 w-full rounded" />
          <div className="h-1.5 bg-gray-200 w-5/6 rounded" />
        </div>
      </div>
    ),
  },
  {
    id: "minimal",
    name: "Minimal",
    desc: "Typography-first, light design",
    preview: (
      <div className="w-full h-20 bg-white border border-gray-100 rounded overflow-hidden flex flex-col p-2 space-y-1.5">
        <div className="h-2 bg-gray-900 w-1/4 rounded" />
        <div className="h-px bg-gray-200 w-full" />
        <div className="h-1.5 bg-gray-100 w-3/4 rounded" />
        <div className="h-1.5 bg-gray-100 w-full rounded" />
        <div className="h-1.5 bg-gray-100 w-2/3 rounded" />
      </div>
    ),
  },
];

// ------ Quick Add Customer Modal ------
function QuickAddCustomerModal({
  onAdd,
  onClose,
}: {
  onAdd: (customer: Customer) => void;
  onClose: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setErr("");
    const fd = new FormData(e.currentTarget);
    const body = {
      name: fd.get("name"),
      email: fd.get("email"),
      phone: fd.get("phone"),
      gstin: fd.get("gstin"),
      stateCode: fd.get("stateCode"),
      address: fd.get("address"),
      isRegistered: fd.get("isRegistered") === "true",
    };
    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onAdd(data); // pass new customer back to form
      onClose();
    } catch (e: any) {
      setErr(e.message);
      setSaving(false);
    }
  };

  const inputCls =
    "w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 transition-all";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/25 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-900">New Customer</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>
        {err && <p className="mb-3 text-xs text-red-600 bg-red-50 px-3 py-2 rounded-md">{err}</p>}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Name *</label>
            <input name="name" required placeholder="Acme Corp" className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">GSTIN</label>
              <input name="gstin" placeholder="27AAAAA0000A1Z5" className={inputCls} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">State Code *</label>
              <input name="stateCode" required placeholder="27" maxLength={2} className={inputCls} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Email</label>
              <input name="email" type="email" placeholder="name@company.com" className={inputCls} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Phone</label>
              <input name="phone" placeholder="9876543210" className={inputCls} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" name="isRegistered" id="isReg" value="true" className="rounded border-gray-300" />
            <label htmlFor="isReg" className="text-xs text-gray-700">GST Registered</label>
          </div>
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 text-sm border border-gray-200 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm bg-gray-900 text-white rounded-md hover:bg-gray-700 transition-colors disabled:opacity-60"
            >
              {saving && <Loader2 className="w-3 h-3 animate-spin" />}
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ------ Main Form ------
export default function InvoiceForm({
  customers: initialCustomers,
  products,
  orgStateCode,
  defaultInvoiceNumber,
  defaultTemplate,
}: {
  customers: Customer[];
  products: Product[];
  orgStateCode: string;
  defaultInvoiceNumber: string;
  defaultTemplate: string;
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState(defaultTemplate);
  const [showAddCustomer, setShowAddCustomer] = useState(false);

  // Dynamic customer list (grows when user quick-adds)
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);

  const [invoiceNumber, setInvoiceNumber] = useState(defaultInvoiceNumber);
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState("");
  const [customerInput, setCustomerInput] = useState("");
  const [customerStateCode, setCustomerStateCode] = useState("");

  const [items, setItems] = useState<LineItem[]>([
    { id: "1", description: "", hsnCode: "", quantity: 1, unitPrice: 0, taxRate: 18 },
  ]);

  const selectedCustomer = useMemo(
    () => customers.find((c) => c.name === customerInput),
    [customers, customerInput]
  );

  const effectiveStateCode = customerStateCode || selectedCustomer?.stateCode || "";
  const isInterState = !!effectiveStateCode && !!orgStateCode && effectiveStateCode !== orgStateCode;

  const totals = useMemo(() => {
    let subTotal = 0, cgst = 0, sgst = 0, igst = 0;
    items.forEach((item) => {
      const base = item.quantity * item.unitPrice;
      const tax = (base * item.taxRate) / 100;
      subTotal += base;
      if (isInterState) igst += tax;
      else { cgst += tax / 2; sgst += tax / 2; }
    });
    return { subTotal, cgst, sgst, igst, total: subTotal + cgst + sgst + igst };
  }, [items, isInterState]);

  const addItem = () =>
    setItems((p) => [...p, { id: crypto.randomUUID(), description: "", hsnCode: "", quantity: 1, unitPrice: 0, taxRate: 18 }]);

  const removeItem = (id: string) =>
    items.length > 1 && setItems((p) => p.filter((i) => i.id !== id));

  const updateItem = (id: string, field: keyof LineItem, value: string | number) =>
    setItems((p) => p.map((i) => (i.id === id ? { ...i, [field]: value } : i)));

  // Called when QuickAddCustomer saves successfully
  const handleCustomerAdded = (newCustomer: Customer) => {
    setCustomers((p) => [...p, newCustomer]);
    setCustomerInput(newCustomer.name);
    setCustomerStateCode(""); // state code already on the customer object
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceNumber,
          issueDate,
          dueDate,
          customerNameOrId: customerInput,
          customerStateCode,
          template: selectedTemplate,
          items: items.map((i) => ({
            description: i.description,
            hsnCode: i.hsnCode,
            quantity: Number(i.quantity),
            unitPrice: Number(i.unitPrice),
            taxRate: Number(i.taxRate),
          })),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create invoice");
      }
      router.push("/dashboard/invoices");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setIsSubmitting(false);
    }
  };

  const inputCls =
    "w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 transition-all bg-white";

  return (
    <>
      {showAddCustomer && (
        <QuickAddCustomerModal
          onAdd={handleCustomerAdded}
          onClose={() => setShowAddCustomer(false)}
        />
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="px-4 py-3 bg-red-50 text-red-600 text-sm rounded-md border border-red-200">
            {error}
          </div>
        )}

        {/* Template Picker */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Template</p>
          <div className="grid grid-cols-3 gap-3">
            {TEMPLATES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setSelectedTemplate(t.id)}
                className={`text-left rounded-lg p-3 border-2 transition-all ${
                  selectedTemplate === t.id ? "border-gray-900 bg-gray-50" : "border-gray-200 hover:border-gray-300"
                }`}
              >
                {t.preview}
                <p className="mt-2 text-xs font-semibold text-gray-900">{t.name}</p>
                <p className="text-xs text-gray-400">{t.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Invoice Details */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Details</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Invoice Number</label>
              <input
                required
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className={inputCls}
              />
            </div>

            {/* Customer with inline quick-add */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-gray-500">Customer</label>
                <button
                  type="button"
                  onClick={() => setShowAddCustomer(true)}
                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-900 transition-colors"
                >
                  <UserPlus className="w-3 h-3" />
                  New customer
                </button>
              </div>
              <input
                required
                list="customer-list"
                value={customerInput}
                onChange={(e) => setCustomerInput(e.target.value)}
                placeholder="Search or type name"
                className={inputCls}
              />
              <datalist id="customer-list">
                {customers.map((c) => <option key={c.id} value={c.name} />)}
              </datalist>
            </div>

            {!selectedCustomer && customerInput.trim() && (
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Customer State Code <span className="text-red-500">*</span></label>
                <input
                  value={customerStateCode}
                  onChange={(e) => setCustomerStateCode(e.target.value)}
                  placeholder="e.g. 29 for Karnataka"
                  className={inputCls}
                />
              </div>
            )}

            <div>
              <label className="text-xs text-gray-500 mb-1 block">Issue Date</label>
              <input required type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Due Date</label>
              <input required type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={inputCls} />
            </div>
          </div>

          {isInterState && (
            <p className="mt-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2 rounded-md">
              ⚡ Inter-state supply — IGST will apply instead of CGST + SGST
            </p>
          )}
        </div>

        {/* Line Items */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Line Items</p>
          </div>

          <datalist id="product-list">
            {products.map((p) => <option key={p.id} value={p.name} />)}
          </datalist>

          <div>
            {/* Header */}
            <div className="grid grid-cols-[3fr_1fr_80px_110px_90px_32px] gap-2 px-4 py-2 text-xs font-medium text-gray-400 uppercase tracking-wide bg-gray-50 border-b border-gray-100">
              <span>Description</span>
              <span>HSN</span>
              <span>Qty</span>
              <span>Price (₹)</span>
              <span>GST %</span>
              <span />
            </div>

            <div className="divide-y divide-gray-100">
              {items.map((item) => (
                <div key={item.id} className="grid grid-cols-[3fr_1fr_80px_110px_90px_32px] gap-2 px-4 py-2.5 items-center">
                  <input
                    required
                    list="product-list"
                    placeholder="Item or service"
                    value={item.description}
                    onChange={(e) => {
                      updateItem(item.id, "description", e.target.value);
                      const p = products.find((pr) => pr.name === e.target.value);
                      if (p) {
                        updateItem(item.id, "unitPrice", p.price);
                        updateItem(item.id, "hsnCode", p.hsnCode || "");
                        updateItem(item.id, "taxRate", p.taxRate);
                      }
                    }}
                    className="border-0 bg-transparent text-sm text-gray-900 placeholder-gray-300 focus:outline-none w-full"
                  />
                  <input
                    placeholder="—"
                    value={item.hsnCode}
                    onChange={(e) => updateItem(item.id, "hsnCode", e.target.value)}
                    className="border-0 bg-transparent text-sm text-gray-500 focus:outline-none w-full"
                  />
                  <input
                    type="number" min="1"
                    value={item.quantity}
                    onChange={(e) => updateItem(item.id, "quantity", Number(e.target.value))}
                    className="border-0 bg-transparent text-sm text-gray-900 focus:outline-none w-full"
                  />
                  <input
                    type="number" min="0" step="0.01"
                    value={item.unitPrice}
                    onChange={(e) => updateItem(item.id, "unitPrice", Number(e.target.value))}
                    className="border-0 bg-transparent text-sm text-gray-900 focus:outline-none w-full"
                  />
                  <select
                    value={item.taxRate}
                    onChange={(e) => updateItem(item.id, "taxRate", Number(e.target.value))}
                    className="border-0 bg-transparent text-sm text-gray-900 focus:outline-none w-full cursor-pointer"
                  >
                    {[0, 5, 12, 18, 28].map((r) => <option key={r} value={r}>{r}%</option>)}
                  </select>
                  <button type="button" onClick={() => removeItem(item.id)}
                    className="text-gray-300 hover:text-red-400 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="px-4 py-3 border-t border-gray-100">
              <button type="button" onClick={addItem}
                className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-900 transition-colors">
                <Plus className="w-4 h-4" />
                Add line
              </button>
            </div>
          </div>
        </div>

        {/* Totals + Submit */}
        <div className="flex items-end justify-between gap-6">
          <div className="bg-white border border-gray-200 rounded-lg p-4 w-56 space-y-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span><span>₹{totals.subTotal.toFixed(2)}</span>
            </div>
            {isInterState ? (
              <div className="flex justify-between text-gray-600">
                <span>IGST</span><span>₹{totals.igst.toFixed(2)}</span>
              </div>
            ) : (
              <>
                <div className="flex justify-between text-gray-600">
                  <span>CGST</span><span>₹{totals.cgst.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>SGST</span><span>₹{totals.sgst.toFixed(2)}</span>
                </div>
              </>
            )}
            <div className="flex justify-between font-semibold text-gray-900 pt-2 border-t border-gray-100">
              <span>Total</span><span>₹{totals.total.toFixed(2)}</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-700 transition-colors disabled:opacity-60"
          >
            {isSubmitting ? "Saving…" : "Save Invoice"}
          </button>
        </div>
      </form>
    </>
  );
}
