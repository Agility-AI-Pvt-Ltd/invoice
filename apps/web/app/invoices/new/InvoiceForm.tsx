"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

type Customer = {
  id: string;
  name: string;
  stateCode: string | null;
};

type LineItem = {
  id: string;
  description: string;
  hsnCode: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
};

export default function InvoiceForm({ customers, products, orgStateCode }: { customers: Customer[], products: any[], orgStateCode: string }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  
  // Invoice Details
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState("");
  
  // Customer details (allow freeform typing or selecting)
  const [customerInput, setCustomerInput] = useState("");
  const [customerStateCode, setCustomerStateCode] = useState("");
  
  // Line Items
  const [items, setItems] = useState<LineItem[]>([
    { id: "1", description: "", hsnCode: "", quantity: 1, unitPrice: 0, taxRate: 18 }
  ]);

  const selectedCustomer = useMemo(() => customers.find(c => c.id === customerInput || c.name === customerInput), [customers, customerInput]);
  
  // Real-time GST Calculation for UI
  const effectiveStateCode = customerStateCode || selectedCustomer?.stateCode || "";
  const isInterState = effectiveStateCode && orgStateCode && effectiveStateCode !== orgStateCode;

  const totals = useMemo(() => {
    let subTotal = 0;
    let cgst = 0;
    let sgst = 0;
    let igst = 0;

    items.forEach(item => {
      const itemSub = item.quantity * item.unitPrice;
      const itemTax = (itemSub * item.taxRate) / 100;
      
      subTotal += itemSub;
      if (isInterState) {
        igst += itemTax;
      } else {
        cgst += itemTax / 2;
        sgst += itemTax / 2;
      }
    });

    return { subTotal, cgst, sgst, igst, total: subTotal + cgst + sgst + igst };
  }, [items, isInterState]);

  const handleAddItem = () => {
    setItems([...items, { 
      id: Math.random().toString(36).substr(2, 9), 
      description: "", 
      hsnCode: "", 
      quantity: 1, 
      unitPrice: 0, 
      taxRate: 18 
    }]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length === 1) return; // Keep at least one
    setItems(items.filter(item => item.id !== id));
  };

  const updateItem = (id: string, field: keyof LineItem, value: string | number) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceNumber,
          issueDate,
          dueDate,
          customerNameOrId: customerInput,
          customerStateCode: customerStateCode,
          items: items.map(i => ({
            description: i.description,
            hsnCode: i.hsnCode,
            quantity: Number(i.quantity),
            unitPrice: Number(i.unitPrice),
            taxRate: Number(i.taxRate)
          }))
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create invoice");
      }

      // Success
      router.push('/invoices');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setIsSubmitting(false);
    }
  };

  if (customers.length === 0) {
    return (
      <div className={styles.errorBox}>
        You must create at least one customer before generating an invoice.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      {error && <div className={styles.errorBox}>{error}</div>}
      
      {/* Hidden Datalists for Auto-Suggest */}
      <datalist id="customer-list">
        {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
      </datalist>
      <datalist id="product-list">
        {products?.map(p => <option key={p.id} value={p.name} />)}
      </datalist>

      <div className={styles.header}>
        <h1 className={styles.title}>New GST Invoice</h1>
        <button type="submit" disabled={isSubmitting} className={styles.submitBtn}>
          {isSubmitting ? "Saving..." : "Save Invoice"}
        </button>
      </div>

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Details</h2>
        <div className={styles.grid2}>
          <div className={styles.inputGroup}>
            <label>Invoice Number</label>
            <input required value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} placeholder="INV-001" />
          </div>
          <div className={styles.inputGroup}>
            <label>Customer Name or ID</label>
            <input 
              required 
              list="customer-list" 
              value={customerInput} 
              onChange={e => setCustomerInput(e.target.value)} 
              placeholder="Search or type new customer" 
            />
          </div>
          <div className={styles.inputGroup}>
            <label>Customer State Code (If New)</label>
            <input 
              value={customerStateCode} 
              onChange={e => setCustomerStateCode(e.target.value)} 
              placeholder="e.g. 27 for Maharashtra" 
            />
          </div>
          <div className={styles.inputGroup}>
            <label>Issue Date</label>
            <input required type="date" value={issueDate} onChange={e => setIssueDate(e.target.value)} />
          </div>
          <div className={styles.inputGroup}>
            <label>Due Date</label>
            <input required type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
          </div>
        </div>
      </div>

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Line Items</h2>
        
        <div className={styles.itemsTable}>
          <div className={styles.itemsHeader}>
            <div>Description</div>
            <div>HSN/SAC</div>
            <div>Qty</div>
            <div>Price</div>
            <div>GST %</div>
            <div>Amount</div>
            <div></div>
          </div>
          
          {items.map((item) => (
            <div key={item.id} className={styles.itemRow}>
              <input 
                required 
                list="product-list"
                placeholder="Search or type product" 
                value={item.description} 
                onChange={e => {
                  updateItem(item.id, "description", e.target.value);
                  // Auto-fill price if product exists
                  const prod = products?.find(p => p.name === e.target.value);
                  if (prod) {
                    updateItem(item.id, "unitPrice", prod.price);
                    updateItem(item.id, "hsnCode", prod.hsnCode || "");
                    updateItem(item.id, "taxRate", prod.taxRate || 18);
                  }
                }} 
              />
              <input placeholder="HSN" value={item.hsnCode} onChange={e => updateItem(item.id, "hsnCode", e.target.value)} />
              <input required type="number" min="1" value={item.quantity} onChange={e => updateItem(item.id, "quantity", Number(e.target.value))} />
              <input required type="number" min="0" step="0.01" value={item.unitPrice} onChange={e => updateItem(item.id, "unitPrice", Number(e.target.value))} />
              <select value={item.taxRate} onChange={e => updateItem(item.id, "taxRate", Number(e.target.value))}>
                <option value={0}>0%</option>
                <option value={5}>5%</option>
                <option value={12}>12%</option>
                <option value={18}>18%</option>
                <option value={28}>28%</option>
              </select>
              <div className={styles.itemAmount}>
                {((item.quantity * item.unitPrice)).toFixed(2)}
              </div>
              <button type="button" onClick={() => handleRemoveItem(item.id)} className={styles.removeBtn}>✕</button>
            </div>
          ))}
        </div>
        
        <button type="button" onClick={handleAddItem} className={styles.addBtn}>+ Add Line Item</button>
      </div>

      <div className={styles.totalsCard}>
        <div className={styles.totalRow}>
          <span>Subtotal:</span>
          <span>₹{totals.subTotal.toFixed(2)}</span>
        </div>
        
        {isInterState ? (
          <div className={styles.totalRow}>
            <span>IGST:</span>
            <span>₹{totals.igst.toFixed(2)}</span>
          </div>
        ) : (
          <>
            <div className={styles.totalRow}>
              <span>CGST:</span>
              <span>₹{totals.cgst.toFixed(2)}</span>
            </div>
            <div className={styles.totalRow}>
              <span>SGST:</span>
              <span>₹{totals.sgst.toFixed(2)}</span>
            </div>
          </>
        )}
        
        <div className={`${styles.totalRow} ${styles.grandTotal}`}>
          <span>Total:</span>
          <span>₹{totals.total.toFixed(2)}</span>
        </div>
      </div>
    </form>
  );
}
