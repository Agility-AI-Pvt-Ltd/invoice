"use client";

import { useEffect, useId, useState } from "react";
import {
  SUGGESTED_EXPENSE_CATEGORIES,
  SUGGESTED_INCOME_CATEGORIES,
} from "@/lib/expenses/suggest";

export function AddLedgerEntryDialog({
  open,
  onOpenChange,
  onSaved,
  initialKind = "EXPENSE",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
  initialKind?: "INCOME" | "EXPENSE";
}) {
  const baseId = useId();
  const [kind, setKind] = useState<"INCOME" | "EXPENSE">(initialKind);
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [occurredAt, setOccurredAt] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setKind(initialKind);
    setError(null);
    setOccurredAt(new Date().toISOString().slice(0, 10));
  }, [open, initialKind]);

  if (!open) return null;

  const suggestions =
    kind === "INCOME"
      ? SUGGESTED_INCOME_CATEGORIES
      : SUGGESTED_EXPENSE_CATEGORIES;
  const listId = `${baseId}-cat-list`;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const amt = Math.round(Number.parseFloat(amount) * 100);
    if (!category.trim()) {
      setError("Choose or enter a category.");
      return;
    }
    if (!Number.isFinite(amt) || amt <= 0) {
      setError("Enter a positive amount.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/expenses/ledger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind,
          category: category.trim(),
          amount: amt,
          occurredAt,
          description: description.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Save failed");
        return;
      }
      setAmount("");
      setDescription("");
      setCategory("");
      onOpenChange(false);
      onSaved();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
      role="presentation"
      onMouseDown={(ev) => {
        if (ev.target === ev.currentTarget) onOpenChange(false);
      }}
    >
      <div
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${baseId}-title`}
      >
        <h2
          id={`${baseId}-title`}
          className="text-lg font-bold text-foreground heading-display"
        >
          Add ledger entry
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Stored for your organization. Amounts are always positive; type picks
          income vs expense.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="flex gap-2">
            {(["INCOME", "EXPENSE"] as const).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setKind(k)}
                className={`flex-1 rounded-xl px-3 py-2 text-xs font-bold uppercase tracking-wide ${
                  kind === k
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                    : "bg-muted/80 text-muted-foreground hover:bg-muted"
                }`}
              >
                {k === "INCOME" ? "Income" : "Expense"}
              </button>
            ))}
          </div>

          <label className="block space-y-1.5">
            <span className="text-xs font-semibold text-muted-foreground">
              Category
            </span>
            <input
              list={listId}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g. Payroll"
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none ring-primary focus:ring-2"
              autoComplete="off"
            />
            <datalist id={listId}>
              {suggestions.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-semibold text-muted-foreground">
              Amount ({kind === "INCOME" ? "received" : "spent"})
            </span>
            <input
              type="number"
              inputMode="decimal"
              min={0}
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none ring-primary focus:ring-2"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-semibold text-muted-foreground">
              Date
            </span>
            <input
              type="date"
              value={occurredAt}
              onChange={(e) => setOccurredAt(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none ring-primary focus:ring-2"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-semibold text-muted-foreground">
              Description (optional)
            </span>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Client payment — Acme Corp"
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none ring-primary focus:ring-2"
            />
          </label>

          {error ? (
            <p className="text-sm font-medium text-destructive">{error}</p>
          ) : null}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="flex-1 rounded-xl border border-border py-2.5 text-sm font-bold text-foreground hover:bg-muted/60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 hover:opacity-90 disabled:opacity-60"
            >
              {submitting ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
