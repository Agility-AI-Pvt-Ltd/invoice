"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import type { BudgetRow } from "@/lib/expenses/summary";

export function BudgetClient({ initialRows }: { initialRows: BudgetRow[] }) {
  const router = useRouter();
  const [rows, setRows] = useState(initialRows);
  const [category, setCategory] = useState("");
  const [limit, setLimit] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setRows(initialRows);
  }, [initialRows]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const lim = Number.parseFloat(limit);
    if (!category.trim()) {
      setError("Enter a category name.");
      return;
    }
    if (!Number.isFinite(lim) || lim <= 0) {
      setError("Enter a positive monthly limit.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/expenses/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: category.trim(),
          limitAmount: lim,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Could not save");
        return;
      }
      setCategory("");
      setLimit("");
      if (Array.isArray(data.budgets)) setRows(data.budgets);
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  async function removeBudget(id: string) {
    if (!confirm("Remove this budget line?")) return;
    const res = await fetch(`/api/expenses/budgets/${id}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      alert(data.error ?? "Delete failed");
      return;
    }
    if (Array.isArray(data.budgets)) setRows(data.budgets);
    router.refresh();
  }

  return (
    <div className="space-y-8">
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-border bg-card p-5 shadow-sm"
      >
        <h2 className="text-sm font-bold text-foreground">Add or update budget</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Limits are per calendar month (UTC). Actuals use expense ledger entries with the
          same category name.
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="flex-1 space-y-1.5">
            <span className="text-xs font-semibold text-muted-foreground">
              Category
            </span>
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Marketing"
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
            />
          </label>
          <label className="w-full space-y-1.5 sm:w-40">
            <span className="text-xs font-semibold text-muted-foreground">
              Monthly limit (₹)
            </span>
            <input
              type="number"
              inputMode="decimal"
              min={0}
              step="0.01"
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
            />
          </label>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 hover:opacity-90 disabled:opacity-60"
          >
            {submitting ? "Saving…" : "Save budget"}
          </button>
        </div>
        {error ? (
          <p className="mt-3 text-sm font-medium text-destructive">{error}</p>
        ) : null}
      </form>

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No budgets yet. Add a category limit above — actual spend will pull from your
          expense entries for this month.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {rows.map((b) => {
            const pct = Math.min(100, Math.round((b.actual / b.limit) * 100));
            const over = b.actual > b.limit;
            return (
              <section
                key={b.id}
                className="rounded-2xl border border-border bg-card p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {b.category}
                    </p>
                    <p className="mt-1 text-2xl font-bold tabular-nums text-foreground heading-display">
                      ₹{b.actual.toLocaleString("en-IN")}
                      <span className="text-base font-semibold text-muted-foreground">
                        {" "}
                        / ₹{b.limit.toLocaleString("en-IN")}
                      </span>
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => removeBudget(b.id)}
                      className="rounded-xl border border-border p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      aria-label="Remove budget"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <span
                      className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide ${
                        over
                          ? "bg-destructive/15 text-destructive"
                          : pct >= 90
                            ? "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                            : "bg-green-500/15 text-green-700 dark:text-green-400"
                      }`}
                    >
                      {pct}% used
                    </span>
                  </div>
                </div>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full ${over ? "bg-destructive" : "bg-primary"}`}
                    style={{ width: `${Math.min(100, pct)}%` }}
                  />
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
