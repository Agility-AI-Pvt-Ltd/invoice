"use client";

import { useState, useTransition, useEffect } from "react";
import { createPortal } from "react-dom";
import { 
  X, 
  Plus, 
  Loader2, 
  Package, 
  Check, 
  Pencil, 
  Trash2, 
  Tags, 
  IndianRupee, 
  Info,
  Hash,
  Activity,
  Layers,
  AlertCircle
} from "lucide-react";

import { addProduct, updateProduct, deleteProduct } from "./actions";

interface ProductData {
  id: string;
  name: string;
  price: number;
  hsnCode: string | null;
  taxRate: number;
  sku: string | null;
  productKind: string;
}

export default function ProductModal({ 
  product, 
  trigger,
  isOpenOverride,
  onCloseOverride
}: { 
  product?: ProductData;
  trigger?: React.ReactNode;
  isOpenOverride?: boolean;
  onCloseOverride?: () => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const open = isOpenOverride !== undefined ? isOpenOverride : internalOpen;
  const setOpen = (val: boolean) => {
    if (onCloseOverride && !val) onCloseOverride();
    else setInternalOpen(val);
  };

  useEffect(() => {
    setMounted(true);
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [open]);

  const isEdit = !!product;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = isEdit 
        ? await updateProduct(product.id, formData)
        : await addProduct(formData);
        
      if (result?.error) {
        setError(result.error);
      } else {
        setOpen(false);
        window.location.reload();
      }
    });
  };

  const handleDelete = () => {
    if (!product || !confirm("Are you sure you want to delete this item?")) return;
    startTransition(async () => {
      const result = await deleteProduct(product.id);
      if (result?.error) setError(result.error);
      else {
        setOpen(false);
        window.location.reload();
      }
    });
  };

  const inputCls = "w-full bg-secondary/30 border border-border rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary focus:bg-card transition-all placeholder:text-muted-foreground/30 disabled:opacity-50";
  const labelCls = "text-[10px] font-black text-muted-foreground uppercase tracking-[0.15em] mb-1.5 flex items-center gap-2 ml-1";

  const modalContent = open && mounted ? createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-8">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-background/80 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={() => !isPending && setOpen(false)}
      />
      
      {/* Modal Container */}
      <div 
        className="relative w-full max-w-2xl bg-card border border-border shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] rounded-[2.5rem] overflow-hidden animate-in zoom-in-95 fade-in duration-300 flex flex-col h-auto max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden max-h-[90vh]">
          
          {/* Header */}
          <div className="px-10 py-8 border-b border-border flex items-start justify-between bg-card shrink-0 z-20">
            <div className="flex items-center gap-5">
               <div className={`w-14 h-14 rounded-3xl flex items-center justify-center shadow-inner ${isEdit ? 'bg-amber-500/10 text-amber-500' : 'bg-primary/10 text-primary'}`}>
                  {isEdit ? <Pencil className="w-6 h-6" /> : <Package className="w-6 h-6" />}
               </div>
               <div>
                  <h2 className="text-2xl font-black text-foreground tracking-tight leading-none">
                    {isEdit ? 'Edit Item' : 'New Item'}
                  </h2>
                  <p className="text-xs font-bold text-muted-foreground mt-2">
                    {isEdit ? 'Refine your catalog specifications' : 'Add products or services to your inventory'}
                  </p>
               </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="p-3 hover:bg-secondary rounded-2xl transition-all text-muted-foreground hover:text-foreground active:scale-90"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto px-10 py-8 space-y-10">

            
            {/* General Details */}
            <div className="space-y-6">
              <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] flex items-center gap-2">
                <Tags className="w-3 h-3" /> Core Specifications
              </h3>
              
              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-1">
                  <label className={labelCls}>Item Name <span className="text-primary">*</span></label>
                  <input
                    name="name"
                    required
                    defaultValue={product?.name}
                    placeholder="e.g. Premium Consultation"
                    className={inputCls}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className={labelCls}><Activity className="w-3.5 h-3.5" /> Classification</label>
                    <select 
                      name="productKind" 
                      defaultValue={product?.productKind || "SERVICE"} 
                      className={inputCls}
                    >
                      <option value="GOOD">Goods / Physical</option>
                      <option value="SERVICE">Professional Service</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className={labelCls}><Layers className="w-3.5 h-3.5" /> SKU / ID</label>
                    <input
                      name="sku"
                      defaultValue={product?.sku || ''}
                      placeholder="e.g. PRD-1024"
                      className={inputCls}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Pricing & Compliance */}
            <div className="space-y-6">
              <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] flex items-center gap-2">
                <IndianRupee className="w-3 h-3" /> Pricing & Tax
              </h3>
              
              <div className="bg-secondary/20 p-6 rounded-3xl border border-border/50 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className={labelCls}>Unit Price (₹) <span className="text-primary">*</span></label>
                    <input
                      name="price"
                      type="number"
                      step="0.01"
                      required
                      defaultValue={product?.price}
                      placeholder="0.00"
                      className={inputCls}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className={labelCls}>GST Tax Rate</label>
                    <select name="taxRate" defaultValue={product?.taxRate || 18} className={inputCls}>
                      {[0, 5, 12, 18, 28].map(r => <option key={r} value={r}>{r}% GST</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className={labelCls}><Hash className="w-3.5 h-3.5" /> HSN / SAC Code</label>
                  <input
                    name="hsnCode"
                    defaultValue={product?.hsnCode || ''}
                    placeholder="e.g. 998311"
                    className={inputCls}
                  />
                  <div className="mt-4 flex items-start gap-3 p-4 bg-card/50 rounded-2xl border border-border/50 text-[10px] font-bold text-muted-foreground leading-relaxed">
                    <Info className="w-4 h-4 shrink-0 text-primary" />
                    Used for Indian GST compliance reporting.
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-2xl flex items-center gap-3 text-destructive">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <p className="text-xs font-bold">{error}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-10 py-8 border-t border-border bg-secondary/10 flex items-center gap-4 shrink-0">
            {isEdit && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isPending}
                className="p-4 text-destructive/60 hover:text-destructive hover:bg-destructive/5 rounded-2xl transition-all active:scale-90"
              >
                <Trash2 className="w-6 h-6" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex-1 px-6 py-3.5 text-xs font-black text-muted-foreground uppercase tracking-widest hover:text-foreground transition-all"
            >
              Discard
            </button>
            <button
              type="submit"
              disabled={isPending}
              className={`flex-[2] flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-xl active:scale-95 disabled:opacity-50 ${
                isEdit ? 'bg-amber-500 text-white hover:bg-amber-600' : 'bg-primary text-primary-foreground hover:opacity-90'
              }`}
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {isEdit ? 'Save Changes' : 'Add to Catalog'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <>
      {trigger ? (
        <div onClick={() => setOpen(true)} className="cursor-pointer">{trigger}</div>
      ) : (
        isOpenOverride === undefined && (
          <button
            onClick={() => setOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground text-sm font-bold rounded-2xl hover:opacity-90 transition-all shadow-xl shadow-primary/20 active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            Add Item
          </button>
        )
      )}

      {modalContent}
    </>
  );
}

