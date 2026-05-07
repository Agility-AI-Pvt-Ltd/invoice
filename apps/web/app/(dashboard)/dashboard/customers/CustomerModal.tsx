"use client";

import { useState, useTransition } from "react";
import { X, Plus, Loader2, UserPlus, Check, Pencil } from "lucide-react";
import { addCustomer, updateCustomer } from "./actions";

interface CustomerData {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  gstin: string | null;
  stateCode: string | null;
  address: string | null;
  isRegistered: boolean;
}

export default function CustomerModal({ 
  customer, 
  trigger 
}: { 
  customer?: CustomerData;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const isEdit = !!customer;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = isEdit 
        ? await updateCustomer(customer.id, formData)
        : await addCustomer(formData);
        
      if (result?.error) {
        setError(result.error);
      } else {
        setOpen(false);
        // Refresh page to show updates
        window.location.reload();
      }
    });
  };

  const inputCls = "w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-muted-foreground/40";
  const labelCls = "text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em] mb-1.5 block ml-1";

  return (
    <>
      {trigger ? (
        <div onClick={() => setOpen(true)} className="cursor-pointer">{trigger}</div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground text-sm font-bold rounded-xl hover:opacity-90 transition-all shadow-lg shadow-primary/20 active:scale-95"
        >
          <UserPlus className="w-4 h-4" />
          Add New Customer
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-md"
            onClick={() => !isPending && setOpen(false)}
          />
          {/* Modal */}
          <div className="relative bg-card border border-border rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
            {/* Header Gradient */}
            <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${isEdit ? 'from-amber-500 to-orange-500' : 'from-primary via-indigo-500 to-purple-500'}`} />
            
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-xl font-bold text-foreground heading-display">{isEdit ? 'Edit Customer' : 'New Customer'}</h2>
                  <p className="text-xs text-muted-foreground mt-1">{isEdit ? 'Update existing client profile.' : 'Create a professional client profile.'}</p>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="p-2 hover:bg-secondary rounded-xl transition-colors text-muted-foreground hover:text-foreground"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {error && (
                <div className="mb-6 px-4 py-3 bg-destructive/10 text-destructive text-xs font-bold rounded-xl border border-destructive/20 animate-in shake">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1">
                  <label className={labelCls}>Legal Business Name *</label>
                  <input
                    name="name"
                    required
                    defaultValue={customer?.name}
                    placeholder="e.g. Acme Solutions Pvt Ltd"
                    className={inputCls}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className={labelCls}>Email Address</label>
                    <input
                      name="email"
                      type="email"
                      defaultValue={customer?.email || ''}
                      placeholder="billing@acme.com"
                      className={inputCls}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className={labelCls}>Contact Number</label>
                    <input
                      name="phone"
                      defaultValue={customer?.phone || ''}
                      placeholder="+91 98765 43210"
                      className={inputCls}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className={labelCls}>GSTIN Number</label>
                    <input
                      name="gstin"
                      defaultValue={customer?.gstin || ''}
                      placeholder="27AAAAA0000A1Z5"
                      className={`${inputCls} uppercase font-mono tracking-wider`}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className={labelCls}>State Code *</label>
                    <input
                      name="stateCode"
                      required
                      defaultValue={customer?.stateCode || ''}
                      placeholder="27"
                      maxLength={2}
                      className={inputCls}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className={labelCls}>Registered Address</label>
                  <textarea
                    name="address"
                    rows={2}
                    defaultValue={customer?.address || ''}
                    placeholder="Floor 4, Business Park, Mumbai, MH..."
                    className={`${inputCls} resize-none h-20`}
                  />
                </div>

                <div className="flex items-center gap-3 pt-1 group cursor-pointer">
                  <div className="relative flex items-center justify-center">
                    <input
                      type="checkbox"
                      name="isRegistered"
                      id="isRegistered"
                      value="true"
                      defaultChecked={customer?.isRegistered}
                      className="peer h-5 w-5 cursor-pointer appearance-none rounded-lg border border-border bg-background transition-all checked:bg-primary checked:border-primary"
                    />
                    <Check className="absolute h-3 w-3 text-primary-foreground opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" />
                  </div>
                  <label htmlFor="isRegistered" className="text-xs font-bold text-foreground cursor-pointer select-none">
                    Customer is GST Registered
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="flex-1 px-4 py-3 border border-border text-foreground text-sm font-bold rounded-2xl hover:bg-secondary transition-all active:scale-[0.98]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground text-sm font-bold rounded-2xl hover:opacity-90 transition-all shadow-lg shadow-primary/20 disabled:opacity-60 active:scale-[0.98]"
                  >
                    {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    {isEdit ? 'Update Profile' : 'Save Profile'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
