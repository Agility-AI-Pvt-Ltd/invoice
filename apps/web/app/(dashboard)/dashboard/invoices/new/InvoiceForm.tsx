"use client";

import { useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Trash2,
  X,
  Loader2,
  UserPlus,
  FileText,
  User,
  Calendar,
  Receipt,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Box,
} from "lucide-react";

type Customer = { id: string; name: string; stateCode: string | null };
type Product = {
  id: string;
  name: string;
  price: number;
  hsnCode: string | null;
  taxRate: number;
  productKind: string;
};
const INDIAN_STATES = [
  { code: "01", name: "Jammu & Kashmir" },
  { code: "02", name: "Himachal Pradesh" },
  { code: "03", name: "Punjab" },
  { code: "04", name: "Chandigarh" },
  { code: "05", name: "Uttarakhand" },
  { code: "06", name: "Haryana" },
  { code: "07", name: "Delhi" },
  { code: "08", name: "Rajasthan" },
  { code: "09", name: "Uttar Pradesh" },
  { code: "10", name: "Bihar" },
  { code: "11", name: "Sikkim" },
  { code: "12", name: "Arunachal Pradesh" },
  { code: "13", name: "Nagaland" },
  { code: "14", name: "Manipur" },
  { code: "15", name: "Mizoram" },
  { code: "16", name: "Tripura" },
  { code: "17", name: "Meghalaya" },
  { code: "18", name: "Assam" },
  { code: "19", name: "West Bengal" },
  { code: "20", name: "Jharkhand" },
  { code: "21", name: "Odisha" },
  { code: "22", name: "Chhattisgarh" },
  { code: "23", name: "Madhya Pradesh" },
  { code: "24", name: "Gujarat" },
  { code: "26", name: "Dadra & Nagar Haveli and Daman & Diu" },
  { code: "27", name: "Maharashtra" },
  { code: "29", name: "Karnataka" },
  { code: "30", name: "Goa" },
  { code: "31", name: "Lakshadweep" },
  { code: "32", name: "Kerala" },
  { code: "33", name: "Tamil Nadu" },
  { code: "34", name: "Puducherry" },
  { code: "35", name: "Andaman & Nicobar Islands" },
  { code: "36", name: "Telangana" },
  { code: "37", name: "Andhra Pradesh" },
  { code: "38", name: "Ladakh" },
  { code: "97", name: "Other Territory" },
];

type LineItem = {
  id: string;
  productId: string | null;
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
      <div className="w-full h-20 bg-background border border-border rounded overflow-hidden flex flex-col">
        <div className="h-4 bg-primary w-full" />
        <div className="flex-1 p-1.5 space-y-1">
          <div className="h-1.5 bg-muted w-3/4 rounded" />
          <div className="h-1.5 bg-muted/50 w-1/2 rounded" />
          <div className="mt-1 h-1.5 bg-muted w-full rounded" />
          <div className="h-1.5 bg-muted w-full rounded" />
        </div>
      </div>
    ),
  },
  {
    id: "classic",
    name: "Classic",
    desc: "Traditional bordered layout",
    preview: (
      <div className="w-full h-20 bg-background border-2 border-foreground rounded overflow-hidden flex flex-col">
        <div className="p-1.5 border-b-2 border-foreground">
          <div className="h-2 bg-foreground w-1/3 rounded" />
        </div>
        <div className="flex-1 p-1.5 space-y-1">
          <div className="h-1.5 bg-muted w-full rounded" />
          <div className="h-1.5 bg-muted w-5/6 rounded" />
        </div>
      </div>
    ),
  },
  {
    id: "minimal",
    name: "Minimal",
    desc: "Typography-first, light design",
    preview: (
      <div className="w-full h-20 bg-background border border-border rounded overflow-hidden flex flex-col p-2 space-y-1.5">
        <div className="h-2 bg-foreground w-1/4 rounded" />
        <div className="h-px bg-border w-full" />
        <div className="h-1.5 bg-muted w-3/4 rounded" />
        <div className="h-1.5 bg-muted w-full rounded" />
        <div className="h-1.5 bg-muted w-2/3 rounded" />
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
      onAdd(data);
      onClose();
    } catch (e: any) {
      setErr(e.message);
      setSaving(false);
    }
  };

  const inputCls =
    "w-full border border-border bg-background rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in">
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-card rounded-2xl shadow-2xl w-full max-w-md p-6 border border-border">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold heading-display">New Customer</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-secondary rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
        {err && (
          <p className="mb-4 text-xs text-destructive bg-destructive/10 px-3 py-2 rounded-lg border border-destructive/20 font-medium">
            {err}
          </p>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-muted-foreground mb-1.5 block uppercase tracking-wider">
              Full Name *
            </label>
            <input
              name="name"
              required
              placeholder="e.g. Acme Corporation"
              className={inputCls}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-muted-foreground mb-1.5 block uppercase tracking-wider">
                GSTIN
              </label>
              <input
                name="gstin"
                placeholder="27AAAAA0000A1Z5"
                className={inputCls}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground mb-1.5 block uppercase tracking-wider">
                State Code *
              </label>
              <input
                name="stateCode"
                required
                placeholder="27"
                maxLength={2}
                className={inputCls}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-muted-foreground mb-1.5 block uppercase tracking-wider">
                Email Address
              </label>
              <input
                name="email"
                type="email"
                placeholder="billing@acme.com"
                className={inputCls}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground mb-1.5 block uppercase tracking-wider">
                Phone
              </label>
              <input
                name="phone"
                placeholder="+91 98765 43210"
                className={inputCls}
              />
            </div>
          </div>
          <div className="flex items-center gap-3 py-2">
            <input
              type="checkbox"
              name="isRegistered"
              id="isReg"
              value="true"
              className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20 cursor-pointer"
            />
            <label
              htmlFor="isReg"
              className="text-sm font-medium text-foreground cursor-pointer"
            >
              This customer is GST registered
            </label>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 text-sm font-bold border border-border rounded-xl text-foreground hover:bg-secondary transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-all shadow-lg shadow-primary/20 disabled:opacity-60"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <UserPlus className="w-4 h-4" />
              )}
              Save Customer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

type ExistingData = {
  id: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  customerNameOrId: string;
  placeOfSupply: string;
  notes: string;
  items: {
    productId: string | null;
    description: string;
    hsnCode: string;
    quantity: number;
    unitPrice: number;
    taxRate: number;
  }[];
};

// ------ Main Form ------
export default function InvoiceForm({
  customers: initialCustomers,
  products,
  orgStateCode,
  defaultInvoiceNumber,
  defaultTemplate,
  editMode = false,
  existingData,
}: {
  customers: Customer[];
  products: Product[];
  orgStateCode: string;
  defaultInvoiceNumber: string;
  defaultTemplate: string;
  editMode?: boolean;
  existingData?: ExistingData;
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState(defaultTemplate);
  const [showAddCustomer, setShowAddCustomer] = useState(false);

  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);

  const [invoiceNumber, setInvoiceNumber] = useState(
    existingData?.invoiceNumber ?? defaultInvoiceNumber,
  );
  const [issueDate, setIssueDate] = useState(
    existingData?.issueDate ?? new Date().toLocaleDateString("en-CA"),
  ); // YYYY-MM-DD
  const [dueDate, setDueDate] = useState(existingData?.dueDate ?? "");
  const [notes, setNotes] = useState(existingData?.notes ?? "");

  const initialCustomerName = existingData
    ? (initialCustomers.find((c) => c.id === existingData.customerNameOrId)
        ?.name ?? existingData.customerNameOrId)
    : "";
  const [customerInput, setCustomerInput] = useState(initialCustomerName);
  const [customerStateCode, setCustomerStateCode] = useState("");
  const [placeOfSupplyOverride, setPlaceOfSupplyOverride] = useState("");
  const [manualTaxMode, setManualTaxMode] = useState<"AUTO" | "INTRA" | "INTER">("AUTO");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerDetails, setCustomerDetails] = useState("");

  const [items, setItems] = useState<LineItem[]>(
    existingData?.items.map((item, i) => ({
      id: String(i + 1),
      productId: item.productId ?? null,
      description: item.description,
      hsnCode: item.hsnCode,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      taxRate: item.taxRate,
    })) ?? [
      {
        id: "1",
        productId: null,
        description: "",
        hsnCode: "",
        quantity: 0,
        unitPrice: 0,
        taxRate: 18,
      },
    ],
  );

  const selectedCustomer = useMemo(
    () => customers.find((c) => c.name === customerInput),
    [customers, customerInput],
  );

  const effectiveStateCode =
    placeOfSupplyOverride || customerStateCode || selectedCustomer?.stateCode || "";
  const isInterState = useMemo(() => {
    if (manualTaxMode === "INTRA") return false;
    if (manualTaxMode === "INTER") return true;
    if (!effectiveStateCode || !orgStateCode) return false;
    const s1 = effectiveStateCode.match(/\d+/)?.[0] || "";
    const s2 = orgStateCode.match(/\d+/)?.[0] || "";
    return !!s1 && !!s2 && s1 !== s2;
  }, [effectiveStateCode, orgStateCode, manualTaxMode]);

  const totals = useMemo(() => {
    let subTotal = 0,
      cgst = 0,
      sgst = 0,
      igst = 0;
    items.forEach((item) => {
      const base = item.quantity * item.unitPrice;
      const tax = (base * item.taxRate) / 100;
      subTotal += base;
      if (isInterState) igst += tax;
      else {
        cgst += tax / 2;
        sgst += tax / 2;
      }
    });
    return { subTotal, cgst, sgst, igst, total: subTotal + cgst + sgst + igst };
  }, [items, isInterState]);

  const addItem = () =>
    setItems((p) => [
      ...p,
      {
        id: Math.random().toString(36).substr(2, 9),
        productId: null,
        description: "",
        hsnCode: "",
        quantity: 0,
        unitPrice: 0,
        taxRate: 18,
      },
    ]);

  const removeItem = (id: string) =>
    items.length > 1 && setItems((p) => p.filter((i) => i.id !== id));

  const updateItem = (
    id: string,
    field: keyof LineItem,
    value: string | number,
  ) =>
    setItems((p) => p.map((i) => (i.id === id ? { ...i, [field]: value } : i)));

  const handleCustomerAdded = (newCustomer: Customer) => {
    setCustomers((p) => [...p, newCustomer]);
    setCustomerInput(newCustomer.name);
    setCustomerStateCode("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    try {
      const url =
        editMode && existingData
          ? `/api/invoices/${existingData.id}`
          : "/api/invoices";
      const method = editMode ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceNumber,
          issueDate,
          dueDate,
          notes,
          customerNameOrId: customerInput,
          customerStateCode,
          customerEmail,
          customerPhone,
          customerDetails,
          template: selectedTemplate,
          placeOfSupply: effectiveStateCode,
          isInterState,
          items: items.map((i) => ({
            productId: i.productId ?? undefined,
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
        throw new Error(
          data.error ||
            (editMode
              ? "Failed to update invoice"
              : "Failed to create invoice"),
        );
      }
      const saved = await res.json();
      router.push(`/dashboard/invoices/${saved.id}`);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setIsSubmitting(false);
    }
  };

  const inputCls =
    "w-full border border-border bg-background rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-muted-foreground/50";

  return (
    <>
      {showAddCustomer && (
        <QuickAddCustomerModal
          onAdd={handleCustomerAdded}
          onClose={() => setShowAddCustomer(false)}
        />
      )}

      <form onSubmit={handleSubmit} className="space-y-8 animate-in">
        {error && (
          <div className="px-4 py-3 bg-destructive/10 text-destructive text-sm font-bold rounded-xl border border-destructive/20 flex items-center gap-2">
            <X className="w-4 h-4" /> {error}
          </div>
        )}

        {/* Section Wrapper */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Main Form Fields */}
          <div className="lg:col-span-2 space-y-6">
            {/* Template Selection */}
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Select Design Template
              </h3>
              <div className="grid grid-cols-3 gap-4">
                {TEMPLATES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedTemplate(t.id)}
                    className={`text-left rounded-xl p-4 border-2 transition-all relative overflow-hidden group ${
                      selectedTemplate === t.id
                        ? "border-primary bg-primary/5 shadow-md"
                        : "border-border hover:border-primary/30"
                    }`}
                  >
                    {t.preview}
                    <div className="mt-3">
                      <p
                        className={`text-xs font-bold ${selectedTemplate === t.id ? "text-primary" : "text-foreground"}`}
                      >
                        {t.name}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">
                        {t.desc}
                      </p>
                    </div>
                    {selectedTemplate === t.id && (
                      <div className="absolute top-2 right-2 bg-primary rounded-full p-0.5">
                        <Plus className="w-3 h-3 text-primary-foreground rotate-45" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Basic Info */}
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-6">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                <Receipt className="w-4 h-4" />
                Invoice Identification
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                    Invoice Number
                  </label>
                  <input
                    required
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    className={inputCls}
                    placeholder="INV-001"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                      Customer
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowAddCustomer(true)}
                      className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1"
                    >
                      <UserPlus className="w-3 h-3" />
                      Add New
                    </button>
                  </div>
                  <input
                    required
                    list="customer-list"
                    value={customerInput}
                    onChange={(e) => setCustomerInput(e.target.value)}
                    placeholder="Type name or select..."
                    className={inputCls}
                  />
                  <datalist id="customer-list">
                    {customers.map((c) => (
                      <option key={c.id} value={c.name} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                    Issue Date
                  </label>
                  <div className="relative">
                    <input
                      required
                      type="date"
                      value={issueDate}
                      onChange={(e) => setIssueDate(e.target.value)}
                      className={`${inputCls} scheme-light dark:scheme-dark`}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                    Due Date
                  </label>
                  <input
                    required
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className={`${inputCls} scheme-light dark:scheme-dark`}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                    Place of Supply (GST State)
                  </label>
                  <select
                    value={placeOfSupplyOverride || (selectedCustomer?.stateCode ? selectedCustomer.stateCode.match(/\d+/)?.[0] : "") || ""}
                    onChange={(e) => setPlaceOfSupplyOverride(e.target.value)}
                    className={inputCls}
                  >
                    <option value="">Auto-detect from Customer</option>
                    {INDIAN_STATES.map(s => (
                      <option key={s.code} value={s.code}>{s.code} - {s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                    Tax Calculation Mode
                  </label>
                  <div className="flex bg-secondary rounded-xl p-1 gap-1">
                    {[
                      { id: "AUTO", label: "Auto" },
                      { id: "INTRA", label: "CGST+SGST" },
                      { id: "INTER", label: "IGST" }
                    ].map(m => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setManualTaxMode(m.id as any)}
                        className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all ${
                          manualTaxMode === m.id 
                            ? "bg-primary text-primary-foreground shadow-sm" 
                            : "text-muted-foreground hover:bg-background/50"
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {!selectedCustomer && customerInput.trim() && (
                <div className="p-6 bg-primary/5 border border-primary/20 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-primary flex items-center gap-2">
                      <UserPlus className="w-4 h-4" /> New Customer Details
                    </p>
                    <span className="text-[10px] font-bold text-primary/50 uppercase tracking-widest bg-primary/10 px-2 py-0.5 rounded-full">
                      Automated CRM
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                        State Code *
                      </label>
                      <input
                        required
                        value={customerStateCode}
                        onChange={(e) => setCustomerStateCode(e.target.value)}
                        placeholder="e.g. 27"
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                        Email Address
                      </label>
                      <input
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        placeholder="client@email.com"
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                        Phone Number
                      </label>
                      <input
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="+91..."
                        className={inputCls}
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5 block">
                      Customer Description / Extra Info (Appears on PDF)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Project name, contact person, or any specific instructions..."
                      value={customerDetails}
                      onChange={(e) => setCustomerDetails(e.target.value)}
                      className={`${inputCls} resize-none min-h-[80px] py-3`}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground italic">
                    Basic details will be saved to your customer database automatically.
                  </p>
                </div>
              )}

              {isInterState && (
                <div className="px-4 py-3 bg-primary/5 border border-primary/20 rounded-xl flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <TrendingUp className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-primary">
                      Inter-state Supply
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      IGST will be automatically applied to all line items.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Line Items */}
            <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-border bg-secondary/30">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                  <Box className="w-4 h-4" />
                  Line Items
                </h3>
              </div>

              {/* <div className="px-6 py-3 border-b border-border bg-secondary/10 hidden md:grid grid-cols-12 gap-4">
                 <div className="col-span-6 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Description</div>
                 <div className="col-span-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">HSN/SAC</div>
                 <div className="col-span-1 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Qty</div>
                 <div className="col-span-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                   Rate (₹)
                   <span className="text-[8px] opacity-40 lowercase font-medium tracking-normal">(Editable)</span>
                 </div>
                 <div className="col-span-1 text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-right">Total</div>
               </div> */}

              <datalist id="product-list">
                {products.map((p) => (
                  <option key={p.id} value={p.name} />
                ))}
              </datalist>

              <div className="divide-y divide-border">
                {/* Item Rows */}
                {items.map((item, index) => (
                  <div
                    key={item.id}
                    className="p-6 space-y-4 hover:bg-secondary/20 transition-colors relative group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                        Item #{index + 1}
                      </span>
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="text-muted-foreground hover:text-destructive p-1 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-4 md:items-end">
                      <div className="flex flex-wrap gap-4 flex-1 min-w-[280px]">
                        <div className="w-full md:flex-1 md:min-w-[280px]">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1 block">
                            Item Name
                          </label>
                          <input
                            required
                            list="product-list"
                            placeholder="Description of goods or services"
                            value={item.description}
                            onChange={(e) => {
                              const v = e.target.value;
                              setItems((p) =>
                                p.map((row) => {
                                  if (row.id !== item.id) return row;
                                  const matched = products.find(
                                    (pr) => pr.name === v,
                                  );
                                  if (matched) {
                                    return {
                                      ...row,
                                      description: v,
                                      productId: matched.id,
                                      unitPrice: matched.price,
                                      hsnCode: matched.hsnCode || "",
                                      taxRate: matched.taxRate,
                                    };
                                  }
                                  return {
                                    ...row,
                                    description: v,
                                    productId: null,
                                  };
                                }),
                              );
                            }}
                            className={inputCls}
                          />
                        </div>
                        <div className="w-full sm:w-[120px]">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1 block">
                            HSN/SAC
                          </label>
                          <input
                            placeholder="HSN/SAC"
                            value={item.hsnCode}
                            onChange={(e) =>
                              updateItem(item.id, "hsnCode", e.target.value)
                            }
                            className={inputCls}
                          />
                        </div>
                        <div className="w-[80px]">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1 block">
                            Qty
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            placeholder="0"
                            value={item.quantity === 0 ? "" : item.quantity}
                            onChange={(e) =>
                              updateItem(
                                item.id,
                                "quantity",
                                Number(e.target.value) || 0,
                              )
                            }
                            className={`${inputCls} tabular-nums`}
                          />
                        </div>
                        <div className="w-[130px]">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1 block flex items-center gap-1">
                            Rate (₹)
                            <span className="text-[8px] bg-primary/10 text-primary px-1 rounded">Edit</span>
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            value={item.unitPrice === 0 ? "" : Number(item.unitPrice.toFixed(2))}
                            onChange={(e) =>
                              updateItem(
                                item.id,
                                "unitPrice",
                                Number(e.target.value) || 0,
                              )
                            }
                            className={`${inputCls} border-primary/20 focus:border-primary shadow-sm`}
                          />
                        </div>
                        <div className="w-[100px]">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1 block">
                            GST %
                          </label>
                          <select
                            value={item.taxRate}
                            onChange={(e) =>
                              updateItem(
                                item.id,
                                "taxRate",
                                Number(e.target.value),
                              )
                            }
                            className="w-full h-[42px] text-xs font-bold bg-secondary/50 border border-border rounded-xl px-2 py-1 focus:ring-2 focus:ring-primary/20"
                          >
                            {[0, 5, 12, 18, 28].map((r) => (
                              <option key={r} value={r}>
                                {r}%
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Tax Breakdown & Totals */}
                      <div className="flex flex-wrap gap-4 items-end bg-primary/5 p-4 rounded-2xl border border-primary/10">
                        {isInterState ? (
                          <div className="w-[90px]">
                            <label className="text-[9px] font-bold text-primary/60 uppercase tracking-tighter mb-1 block">
                              IGST ({item.taxRate}%)
                            </label>
                            <div className="text-xs font-bold tabular-nums text-primary">
                              ₹{((item.quantity * item.unitPrice * item.taxRate) / 100).toFixed(2)}
                            </div>
                          </div>
                        ) : null}
                        
                        <div className="w-[90px]">
                          <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-tighter mb-1 block">
                            CGST ({item.taxRate / 2}%)
                          </label>
                          <div className="text-xs font-bold tabular-nums">
                            ₹{!isInterState ? ((item.quantity * item.unitPrice * (item.taxRate / 2)) / 100).toFixed(2) : "0.00"}
                          </div>
                        </div>
                        <div className="w-[90px]">
                          <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-tighter mb-1 block">
                            SGST ({item.taxRate / 2}%)
                          </label>
                          <div className="text-xs font-bold tabular-nums">
                            ₹{!isInterState ? ((item.quantity * item.unitPrice * (item.taxRate / 2)) / 100).toFixed(2) : "0.00"}
                          </div>
                        </div>
                        
                        <div className="w-[140px] ml-auto">
                          <label className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1 block">
                            Total (Incl. Tax)
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            key={`total-${item.id}-${item.unitPrice}-${item.quantity}-${item.taxRate}`}
                            defaultValue={(
                              (item.quantity || 0) *
                              (item.unitPrice || 0) *
                              (1 + (item.taxRate || 0) / 100)
                            ).toFixed(2)}
                            onBlur={(e) => {
                              const totalInclTax = Number(e.target.value) || 0;
                              const qty = item.quantity || 1;
                              const taxRate = item.taxRate || 0;
                              const newUnitPrice = totalInclTax / (qty * (1 + taxRate / 100));
                              updateItem(item.id, "unitPrice", newUnitPrice);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                (e.target as HTMLInputElement).blur();
                              }
                            }}
                            className={`${inputCls} border-primary/40 bg-white font-bold text-primary focus:ring-primary/30`}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="px-6 py-4 bg-secondary/10 flex justify-center border-t border-border">
                <button
                  type="button"
                  onClick={addItem}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-primary hover:bg-primary/10 rounded-xl transition-all active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  Add Another Item
                </button>
              </div>
            </div>
          </div>

          {/* Sticky Summary Sidebar */}
          <div className="lg:sticky lg:top-8 space-y-6">
            <div className="bg-card border border-border rounded-2xl p-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-primary" />
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-6">
                Invoice Summary
              </h3>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-semibold">
                    ₹{totals.subTotal.toLocaleString("en-IN")}
                  </span>
                </div>

                {isInterState ? (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">IGST Total</span>
                    <span className="font-semibold">
                      ₹{totals.igst.toLocaleString("en-IN")}
                    </span>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">CGST Total</span>
                      <span className="font-semibold">
                        ₹{totals.cgst.toLocaleString("en-IN")}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">SGST Total</span>
                      <span className="font-semibold">
                        ₹{totals.sgst.toLocaleString("en-IN")}
                      </span>
                    </div>
                  </>
                )}

                <div className="pt-4 border-t border-border flex justify-between">
                  <span className="text-base font-bold">Total Amount</span>
                  <span className="text-xl font-bold text-primary">
                    ₹{totals.total.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                    Additional Notes
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Thank you for your business!"
                    className={`${inputCls} h-24 resize-none`}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 py-4 bg-primary text-primary-foreground font-bold rounded-2xl hover:opacity-90 transition-all shadow-lg shadow-primary/20 disabled:opacity-60 active:scale-[0.98]"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5" />
                  )}
                  {editMode ? "Update & Save" : "Create Invoice"}
                </button>

                <button
                  type="button"
                  onClick={() => router.back()}
                  className="w-full py-2.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
                >
                  Discard Changes
                </button>
              </div>
            </div>

            <div className="p-4 bg-secondary/30 rounded-2xl border border-border flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                Invoice will be saved as a{" "}
                <span className="font-bold text-foreground">DRAFT</span>. You
                can send it via email or WhatsApp once it's created.
              </p>
            </div>
          </div>
        </div>
      </form>
    </>
  );
}
