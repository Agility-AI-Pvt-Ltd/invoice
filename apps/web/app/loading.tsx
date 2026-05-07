import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 animate-in fade-in duration-1000">
      <div className="flex flex-col items-center gap-6">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-primary/10 border-t-primary rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 bg-primary rounded-xl animate-pulse" />
          </div>
        </div>
        <div className="space-y-1.5 text-center">
          <p className="text-sm font-black tracking-[0.2em] uppercase text-foreground">Invoicely</p>
          <p className="text-xs text-muted-foreground font-medium animate-pulse">Initializing professional environment...</p>
        </div>
      </div>
    </div>
  );
}
