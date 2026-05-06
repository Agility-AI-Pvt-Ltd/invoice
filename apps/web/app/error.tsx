"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCcw, Home } from "lucide-react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global Error Boundary caught:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-card border border-border rounded-[2.5rem] p-10 shadow-2xl shadow-black/5 text-center space-y-8 animate-in fade-in zoom-in duration-500">
        <div className="w-20 h-20 bg-destructive/10 rounded-3xl flex items-center justify-center mx-auto text-destructive animate-pulse">
          <AlertCircle className="w-10 h-10" />
        </div>
        
        <div className="space-y-3">
          <h1 className="text-3xl font-black tracking-tight heading-display text-foreground">Something went wrong</h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            We encountered an unexpected error. Don't worry, your data is safe. 
            Try refreshing the page or return to safety.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => reset()}
            className="flex items-center justify-center gap-2 w-full py-4 bg-primary text-primary-foreground font-black rounded-2xl hover:opacity-90 transition-all shadow-xl shadow-primary/20 active:scale-95"
          >
            <RefreshCcw className="w-5 h-5" />
            Try Again
          </button>
          
          <Link
            href="/dashboard"
            className="flex items-center justify-center gap-2 w-full py-4 bg-secondary text-foreground font-bold rounded-2xl hover:bg-border transition-all border border-border"
          >
            <Home className="w-5 h-5" />
            Back to Dashboard
          </Link>
        </div>

        <p className="text-[10px] text-muted-foreground font-mono opacity-50 uppercase tracking-widest">
          Error ID: {error.digest || "UNSPECIFIED"}
        </p>
      </div>
    </div>
  );
}
