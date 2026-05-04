"use client";

import { useActionState } from "react";
import { onboardUser } from "./actions";
import { Loader2 } from "lucide-react";

export function OnboardingForm() {
  const [state, formAction, isPending] = useActionState(onboardUser, null);

  return (
    <form action={formAction} className="space-y-6">
      <div className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="ob-companyName" className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] ml-1">
            Company Registered Name
          </label>
          <input
            id="ob-companyName"
            name="companyName"
            placeholder="e.g. Acme Solutions Pvt Ltd"
            required
            className="flex h-12 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm font-medium placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
          {state?.errors?.companyName && (
            <p className="text-xs font-bold text-destructive ml-1">{state.errors.companyName[0]}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="ob-gstin" className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] ml-1">
              GSTIN <span className="text-muted-foreground/50">(Optional)</span>
            </label>
            <input
              id="ob-gstin"
              name="gstin"
              placeholder="27AAAAA0000A1Z5"
              className="flex h-12 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm font-medium placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all uppercase tracking-wider"
            />
            {state?.errors?.gstin && (
              <p className="text-xs font-bold text-destructive ml-1">{state.errors.gstin[0]}</p>
            )}
          </div>
          <div className="space-y-2">
            <label htmlFor="ob-stateCode" className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] ml-1">
              State Code
            </label>
            <input
              id="ob-stateCode"
              name="stateCode"
              placeholder="27"
              required
              className="flex h-12 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm font-medium placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
            {state?.errors?.stateCode && (
              <p className="text-xs font-bold text-destructive ml-1">{state.errors.stateCode[0]}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="ob-address" className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] ml-1">
            Registered Address
          </label>
          <textarea
            id="ob-address"
            name="address"
            placeholder="Floor 4, Business Park..."
            required
            rows={3}
            className="flex min-h-[100px] w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm font-medium placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
          />
          {state?.errors?.address && (
            <p className="text-xs font-bold text-destructive ml-1">{state.errors.address[0]}</p>
          )}
        </div>
      </div>

      {state?.message && (
        <div className="p-3 bg-destructive/10 text-destructive rounded-xl text-xs font-bold border border-destructive/20 animate-in">
          {state.message}
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="relative group w-full flex items-center justify-center h-12 rounded-2xl bg-primary text-primary-foreground text-sm font-bold shadow-xl shadow-primary/20 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none mt-4"
      >
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Finalizing your workspace...
          </>
        ) : (
          <>
            Complete Professional Setup
            <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
          </>
        )}
      </button>
    </form>
  );
}
