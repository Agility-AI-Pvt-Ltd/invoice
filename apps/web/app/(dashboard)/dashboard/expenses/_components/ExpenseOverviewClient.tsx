"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  ArrowDownRight,
  ChevronRight,
  Plus,
  Trash2,
} from "lucide-react";
import type { ExpenseDashboardSummary } from "@/lib/expenses/summary";
import { amountsToBreakdownRows } from "@/lib/expenses/breakdown";
import { ExpenseStatCard } from "./ExpenseStatCard";
import { ExpenseBreakdownList } from "./ExpenseBreakdownList";
import { formatInr, formatInrSigned } from "../_lib/format";
import { AddLedgerEntryDialog } from "./AddLedgerEntryDialog";
import { ExpensesOnlyChart } from "./ExpensesOnlyChart";
import { OutputGstCard } from "./OutputGstCard";

function trendLine(pct: number | null, invertGood?: boolean): { text?: string; trendUp?: boolean } {
  if (pct === null) return {};
  const arrow = pct >= 0 ? "↑" : "↓";
  const text = `${arrow} ${Math.abs(pct)}% vs last month`;
  const up = invertGood ? pct <= 0 : pct >= 0;
  return { text, trendUp: up };
}

export function ExpenseOverviewClient({
  summary,
}: {
  summary: ExpenseDashboardSummary;
}) {
  const router = useRouter();
  const [addOpen, setAddOpen] = useState(false);

  // Only expenses for the chart
  const chartData = useMemo(
    () =>
      summary.chartMonths.map((m) => ({
        month: m.label,
        expenses: m.expenses,
      })),
    [summary.chartMonths],
  );

  const breakdownRows = amountsToBreakdownRows(summary.expenseBreakdown);

  const expenseTrend = trendLine(summary.trends.expensePct, true);

  // Only show expense transactions
  const expenseTransactions = summary.recent.filter((tx) => tx.kind === "EXPENSE");

  async function deleteEntry(id: string) {
    if (!confirm("Delete this ledger entry?")) return;
    const res = await fetch(`/api/expenses/ledger/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error ?? "Could not delete");
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/25 hover:opacity-90 sm:w-auto"
        >
          <Plus className="h-4 w-4" aria-hidden />
          Add expense
        </button>
      </div>

      <AddLedgerEntryDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        initialKind="EXPENSE"
        onSaved={() => router.refresh()}
      />

      {/* Expense-only stat cards */}
      <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2">
        <ExpenseStatCard
          icon={ArrowDownRight}
          label="Total expenses"
          value={formatInr(summary.currentMonth.expenses)}
          trend={expenseTrend.text}
          trendUp={expenseTrend.trendUp}
        />
        <OutputGstCard
          totalFormatted={formatInr(summary.gstToPay)}
          breakdownFormatted={{
            cgst: formatInr(summary.gstBreakdown.cgst),
            sgst: formatInr(summary.gstBreakdown.sgst),
            igst: formatInr(summary.gstBreakdown.igst),
          }}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        {/* Expenses trend chart */}
        <section className="xl:col-span-3 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-bold tracking-tight text-foreground heading-display">
              Expenses over time
            </h2>
            <span className="inline-flex w-fit items-center rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-semibold text-muted-foreground">
              Last 6 months (UTC)
            </span>
          </div>
          <div className="mt-6">
            <ExpensesOnlyChart data={chartData} />
          </div>
        </section>

        {/* Expense breakdown */}
        <section className="xl:col-span-2 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-bold tracking-tight text-foreground heading-display">
              Expense breakdown
            </h2>
            <span className="inline-flex w-fit items-center rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-semibold text-muted-foreground">
              This month (UTC)
            </span>
          </div>
          <div className="mt-6">
            {breakdownRows.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No expense entries this month. Add expenses to see category mix.
              </p>
            ) : (
              <ExpenseBreakdownList rows={breakdownRows} />
            )}
          </div>
        </section>
      </div>

      {/* Recent expense transactions only */}
      <section className="rounded-2xl border border-border bg-card shadow-sm">
        <div className="flex flex-col gap-4 border-b border-border px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-bold tracking-tight text-foreground heading-display">
            Recent expenses
          </h2>
          <a
            href="/dashboard/expenses/analytics"
            className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
          >
            Reports
            <ChevronRight className="h-4 w-4" aria-hidden />
          </a>
        </div>
        {expenseTransactions.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-muted-foreground">
            No expense transactions yet. Use{" "}
            <button
              type="button"
              className="font-semibold text-primary underline-offset-2 hover:underline"
              onClick={() => setAddOpen(true)}
            >
              Add expense
            </button>{" "}
            to start tracking.
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {expenseTransactions.map((tx) => {
              const txDate = new Date(tx.occurredAt);
              const meta = `${tx.category} · ${txDate.toLocaleDateString("en-IN", {
                month: "short",
                day: "numeric",
                timeZone: "UTC",
              })}`;
              const title =
                tx.description?.trim() || `Expense — ${tx.category}`;

              return (
                <li
                  key={tx.id}
                  className="flex flex-col gap-4 px-6 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 flex-1 items-start gap-4">
                    <div
                      className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500/15 text-orange-600 dark:text-orange-400"
                      aria-hidden
                    >
                      <span className="text-xs font-bold">↓</span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground">{title}</p>
                      <p className="text-xs text-muted-foreground">{meta}</p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2 sm:justify-end">
                    {!tx.isPayment && (
                      <button
                        type="button"
                        onClick={() => deleteEntry(tx.id)}
                        className="rounded-xl border border-border p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        aria-label="Delete entry"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                    <span className="rounded-full bg-orange-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-orange-600 dark:text-orange-400">
                      Expense
                    </span>
                    <span className="min-w-[6.5rem] text-right text-sm font-bold tabular-nums text-orange-600 dark:text-orange-400">
                      {formatInrSigned(-tx.amount)}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <p className="text-center text-xs text-muted-foreground">
        Months roll up in UTC to match your server dates. All figures come from
        ledger entries you add here (per organization).
      </p>
    </div>
  );
}
