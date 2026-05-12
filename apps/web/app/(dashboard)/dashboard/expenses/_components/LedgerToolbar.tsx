"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus } from "lucide-react";
import { AddLedgerEntryDialog } from "./AddLedgerEntryDialog";

export function LedgerToolbar({
  defaultKind,
  buttonLabel,
  variant = "primary",
}: {
  defaultKind: "INCOME" | "EXPENSE";
  buttonLabel: string;
  variant?: "primary" | "secondary";
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const cls =
    variant === "primary"
      ? "inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 hover:opacity-90"
      : "inline-flex items-center gap-2 rounded-2xl border border-border bg-card px-5 py-2.5 text-sm font-bold text-foreground shadow-sm hover:bg-muted/60";

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={cls}>
        <Plus className="h-4 w-4 shrink-0" aria-hidden />
        {buttonLabel}
      </button>
      <AddLedgerEntryDialog
        open={open}
        onOpenChange={setOpen}
        initialKind={defaultKind}
        onSaved={() => router.refresh()}
      />
    </>
  );
}
