"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, FileDown } from "lucide-react";

type PeriodRow = { period: string; income: number; expenses: number };

export default function ExpenseAnalyticsPage() {
  const [granularity, setGranularity] = useState<
    "monthly" | "quarterly" | "annual"
  >("quarterly");
  const [periods, setPeriods] = useState<PeriodRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/expenses/report?granularity=${granularity}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Load failed");
        setPeriods([]);
        return;
      }
      setPeriods(Array.isArray(data.periods) ? data.periods : []);
    } finally {
      setLoading(false);
    }
  }, [granularity]);

  useEffect(() => {
    void load();
  }, [load]);

  const csvBlobUrl = useMemo(() => {
    const header = ["Period", "Income", "Expenses", "Net"];
    const lines = [
      header.join(","),
      ...periods.map((r) =>
        [r.period, r.income, r.expenses, r.income - r.expenses].join(","),
      ),
    ];
    const blob = new Blob([lines.join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    return URL.createObjectURL(blob);
  }, [periods]);

  useEffect(() => {
    return () => {
      URL.revokeObjectURL(csvBlobUrl);
    };
  }, [csvBlobUrl]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["monthly", "Monthly"],
              ["quarterly", "Quarterly"],
              ["annual", "Annual"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setGranularity(value)}
              className={`rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
                granularity === value
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                  : "bg-muted/80 text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href={csvBlobUrl}
            download={`expense-report-${granularity}.csv`}
            className="inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground shadow-lg shadow-primary/20 hover:opacity-90"
          >
            <Download className="h-4 w-4" aria-hidden />
            Export CSV
          </a>
          <button
            type="button"
            title="PDF export can reuse invoice templates when connected."
            className="inline-flex cursor-not-allowed items-center gap-2 rounded-2xl border border-dashed border-border px-4 py-2.5 text-xs font-bold text-muted-foreground opacity-80"
            disabled
          >
            <FileDown className="h-4 w-4" aria-hidden />
            Export PDF
          </button>
        </div>
      </div>

      {error ? (
        <p className="text-sm font-medium text-destructive">{error}</p>
      ) : null}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading report…</p>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-muted/40">
            <tr>
              <th className="px-6 py-3 font-semibold text-muted-foreground">
                Period
              </th>
              <th className="px-6 py-3 text-right font-semibold text-muted-foreground">
                Income
              </th>
              <th className="px-6 py-3 text-right font-semibold text-muted-foreground">
                Expenses
              </th>
              <th className="px-6 py-3 text-right font-semibold text-muted-foreground">
                Net
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {periods.length === 0 && !loading ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-6 py-10 text-center text-muted-foreground"
                >
                  No ledger data in range yet. Add entries from Overview.
                </td>
              </tr>
            ) : (
              periods.map((r) => (
                <tr key={r.period} className="hover:bg-muted/30">
                  <td className="px-6 py-4 font-semibold text-foreground">
                    {r.period}
                  </td>
                  <td className="px-6 py-4 text-right font-semibold tabular-nums text-green-600 dark:text-green-400">
                    ₹{r.income.toLocaleString("en-IN")}
                  </td>
                  <td className="px-6 py-4 text-right font-semibold tabular-nums text-orange-600 dark:text-orange-400">
                    ₹{r.expenses.toLocaleString("en-IN")}
                  </td>
                  <td className="px-6 py-4 text-right font-bold tabular-nums text-foreground">
                    ₹{(r.income - r.expenses).toLocaleString("en-IN")}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground">
        Report uses ledger entries from roughly the last three years, aggregated by UTC
        calendar periods.
      </p>
    </div>
  );
}
