"use client";

import { useActionState } from "react";
import { registerUser } from "./actions";
import { Loader2 } from "lucide-react";

export function RegisterForm() {
  const [state, formAction, isPending] = useActionState(registerUser, null);

  return (
    <form action={formAction} className="space-y-6">
      <div className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="reg-name" className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] ml-1">
            Full Name
          </label>
          <input
            id="reg-name"
            name="name"
            placeholder="John Doe"
            required
            className="flex h-12 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm font-medium placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
          {state?.errors?.name && (
            <p className="text-xs font-bold text-destructive ml-1">{state.errors.name[0]}</p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="reg-email" className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] ml-1">
            Work Email
          </label>
          <input
            id="reg-email"
            name="email"
            type="email"
            placeholder="m@example.com"
            required
            className="flex h-12 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm font-medium placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
          {state?.errors?.email && (
            <p className="text-xs font-bold text-destructive ml-1">{state.errors.email[0]}</p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="reg-password" className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] ml-1">
            Create Password
          </label>
          <input
            id="reg-password"
            name="password"
            type="password"
            placeholder="••••••••"
            required
            className="flex h-12 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm font-medium placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
          {state?.errors?.password && (
            <p className="text-xs font-bold text-destructive ml-1">{state.errors.password[0]}</p>
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
            Creating secure account...
          </>
        ) : (
          <>
            Start Billing for Free
            <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
          </>
        )}
      </button>

      <p className="text-center text-xs text-muted-foreground mt-6 font-medium">
        Already using Invoicely? <a href="/login" className="text-primary font-bold hover:underline">Sign in</a>
      </p>
    </form>
  );
}
