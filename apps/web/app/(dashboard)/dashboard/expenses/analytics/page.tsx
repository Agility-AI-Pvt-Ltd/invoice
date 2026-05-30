"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Download,
  FileDown,
  TrendingUp,
  TrendingDown,
  Percent,
  ArrowDownRight,
  Flame,
  Calendar,
  Save,
  Check,
  X,
  Edit2
} from "lucide-react";

import {
  Bar,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ComposedChart,
  Line,
  AreaChart,
  Area,
  Cell,
  BarChart,
  ReferenceLine,
} from "recharts";
import { formatInr, formatInrSigned } from "../_lib/format";
import { SpendHeatmap } from "../_components/SpendHeatmap";

type PeriodRow = { period: string; income: number; expenses: number };

// ─────────────────────────────────────────────
// Custom Tooltip for the composed trend chart
// ─────────────────────────────────────────────
const TrendTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const income = payload.find((p: any) => p.dataKey === "income")?.value ?? 0;
  const expenses = payload.find((p: any) => p.dataKey === "expenses")?.value ?? 0;
  const net = income - expenses;
  return (
    <div className="backdrop-blur-xl bg-card/90 border border-border/80 p-4 rounded-2xl shadow-xl space-y-2 animate-in fade-in duration-200 min-w-[160px]">
      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{label}</p>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-primary" />
            <span className="text-xs text-muted-foreground">Income</span>
          </div>
          <span className="text-xs font-bold tabular-nums">{formatInr(income)}</span>
        </div>
        <div className="flex items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-orange-500" />
            <span className="text-xs text-muted-foreground">Expenses</span>
          </div>
          <span className="text-xs font-bold tabular-nums">{formatInr(expenses)}</span>
        </div>
        <div className="border-t border-border/60 pt-1.5 flex items-center justify-between gap-6">
          <span className="text-xs font-bold text-foreground">Net</span>
          <span className={`text-xs font-bold tabular-nums ${net >= 0 ? "text-green-500" : "text-red-500"}`}>
            {formatInrSigned(net)}
          </span>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// Custom Tooltip for cumulative area chart
// ─────────────────────────────────────────────
const CumulativeTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const cumIncome = payload.find((p: any) => p.dataKey === "cumIncome")?.value ?? 0;
  const cumExpenses = payload.find((p: any) => p.dataKey === "cumExpenses")?.value ?? 0;
  return (
    <div className="backdrop-blur-xl bg-card/90 border border-border/80 p-4 rounded-2xl shadow-xl space-y-2 animate-in fade-in duration-200 min-w-[160px]">
      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{label}</p>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-primary" />
            <span className="text-xs text-muted-foreground">Cumulative Income</span>
          </div>
          <span className="text-xs font-bold tabular-nums">{formatInr(cumIncome)}</span>
        </div>
        <div className="flex items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-orange-500" />
            <span className="text-xs text-muted-foreground">Cumulative Expenses</span>
          </div>
          <span className="text-xs font-bold tabular-nums">{formatInr(cumExpenses)}</span>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// Custom Tooltip for Top Categories bar chart
// ─────────────────────────────────────────────
const CategoryTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="backdrop-blur-xl bg-card/90 border border-border/80 p-3 rounded-2xl shadow-xl animate-in fade-in duration-200">
      <p className="text-xs font-bold text-foreground">{d.category}</p>
      <p className="text-xs text-muted-foreground tabular-nums">{formatInr(d.amount)} ({d.pct}%)</p>
    </div>
  );
};

// ─────────────────────────────────────────────
// Waterfall Chart helper
// ─────────────────────────────────────────────
type WaterfallBar = {
  name: string;
  start: number;
  value: number;
  end: number;
  isTotal: boolean;
  isPositive: boolean;
};

const WaterfallTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const d: WaterfallBar = payload[0]?.payload;
  if (!d) return null;
  return (
    <div className="backdrop-blur-xl bg-card/90 border border-border/80 p-3 rounded-2xl shadow-xl animate-in fade-in duration-200">
      <p className="text-xs font-bold text-foreground">{d.name}</p>
      <p className={`text-xs font-bold tabular-nums ${d.isTotal ? "text-foreground" : d.isPositive ? "text-green-500" : "text-orange-500"}`}>
        {d.isTotal ? formatInr(d.value) : formatInrSigned(d.value)}
      </p>
    </div>
  );
};

// ─────────────────────────────────────────────
// Category colors
// ─────────────────────────────────────────────
const CAT_COLORS = [
  "var(--primary)",
  "#f97316",
  "#f43f5e",
  "#3b82f6",
  "#10b981",
];

// ─────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────
export default function ExpenseAnalyticsPage() {
  const [granularity, setGranularity] = useState<"monthly" | "quarterly" | "annual" | "custom">("quarterly");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [periods, setPeriods] = useState<PeriodRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [anomalyData, setAnomalyData] = useState<{ trends: any[], range: { min: number, max: number, avg: number }, customAnomalyThreshold?: number | null } | null>(null);

  const [isEditingCustom, setIsEditingCustom] = useState(false);
  const [customThresholdInput, setCustomThresholdInput] = useState("");
  const [isSavingThreshold, setIsSavingThreshold] = useState(false);

  const saveCustomThreshold = async (val: string | null) => {
    setIsSavingThreshold(true);
    try {
      const res = await fetch("/api/settings/anomaly-threshold", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threshold: val ? Number(val) : null }),
      });
      if (res.ok) {
        const data = await res.json();
        setAnomalyData((prev) => prev ? { ...prev, customAnomalyThreshold: data.customAnomalyThreshold } : null);
        setIsEditingCustom(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingThreshold(false);
    }
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let url: string;
      if (granularity === "custom" && fromDate && toDate) {
        url = `/api/expenses/report?granularity=monthly&from=${fromDate}&to=${toDate}`;
      } else if (granularity !== "custom") {
        url = `/api/expenses/report?granularity=${granularity}`;
      } else {
        setLoading(false);
        return;
      }
      const res = await fetch(url);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Load failed");
        setPeriods([]);
        return;
      }
      setPeriods(Array.isArray(data.periods) ? data.periods : []);

      // Fetch anomaly insights
      try {
        const anomalyRes = await fetch("/api/analytics");
        if (anomalyRes.ok) {
          const aData = await anomalyRes.json();
          setAnomalyData(aData);
        }
      } catch (err) {
        console.error("Failed to load anomaly data", err);
      }
    } finally {
      setLoading(false);
    }
  }, [granularity, fromDate, toDate]);

  useEffect(() => {
    void load();
  }, [load]);

// CSV Export - client side only
const [csvUrl, setCsvUrl] = useState("");
useEffect(() => {
  const header = ["Period", "Income", "Expenses", "Net"];
  const lines = [
    header.join(","),
    ...periods.map((r) => [r.period, r.income, r.expenses, r.income - r.expenses].join(",")),
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  setCsvUrl(url);
  return () => {
    if (url) URL.revokeObjectURL(url);
  };
}, [periods]);

  // ── Computed analytics metrics ──
  const insights = useMemo(() => {
    if (periods.length === 0) return null;
    let totalIncome = 0;
    let totalExpenses = 0;
    let maxExpense = 0;
    let maxExpensePeriod = "";
    periods.forEach((r) => {
      totalIncome += r.income;
      totalExpenses += r.expenses;
      if (r.expenses > maxExpense) {
        maxExpense = r.expenses;
        maxExpensePeriod = r.period;
      }
    });
    const netSavings = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;
    const avgExpenses = totalExpenses / periods.length;
    const avgIncome = totalIncome / periods.length;
    return { totalIncome, totalExpenses, netSavings, savingsRate, avgExpenses, avgIncome, maxExpense, maxExpensePeriod };
  }, [periods]);

  // ── Chart data for trend ──
  const chartData = useMemo(() =>
    periods.map((p) => ({ period: p.period, income: p.income, expenses: p.expenses, net: p.income - p.expenses })),
    [periods]
  );

  // ── Cumulative area chart data ──
  const cumulativeData = useMemo(() => {
    let cumIncome = 0;
    let cumExpenses = 0;
    return chartData.map((p) => {
      cumIncome += p.income;
      cumExpenses += p.expenses;
      return { period: p.period, cumIncome, cumExpenses };
    });
  }, [chartData]);

  // ── Waterfall chart: period-by-period net cash flow ──
  const waterfallData = useMemo((): WaterfallBar[] => {
    if (chartData.length === 0) return [];
    const bars: WaterfallBar[] = [];
    let running = 0;
    for (const p of chartData) {
      const net = p.income - p.expenses;
      bars.push({ name: p.period, start: running, value: net, end: running + net, isTotal: false, isPositive: net >= 0 });
      running += net;
    }
    // Final total bar
    bars.push({ name: "Total", start: 0, value: running, end: running, isTotal: true, isPositive: running >= 0 });
    return bars;
  }, [chartData]);

  // ── Top 5 expense categories from period data (approximate via distribution) ──
  // We derive top categories from period-level breakdown (expense amounts per period name)
  // Actually we use a separate fetch from the summary endpoint for category data:
  const [categoryData, setCategoryData] = useState<{ category: string; amount: number; pct: number }[]>([]);
  useEffect(() => {
    fetch("/api/expenses/summary")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data?.expenseBreakdown)) {
          const total = data.expenseBreakdown.reduce((s: number, r: any) => s + r.amount, 0);
          const top5 = data.expenseBreakdown.slice(0, 5).map((r: any) => ({
            category: r.category,
            amount: r.amount,
            pct: total > 0 ? +((r.amount / total) * 100).toFixed(1) : 0,
          }));
          setCategoryData(top5);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">

      {/* ── Action Header bar ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {(["monthly", "quarterly", "annual", "custom"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setGranularity(value)}
              className={`rounded-full px-5 py-2.5 text-xs font-bold transition-all duration-300 capitalize ${
                granularity === value
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25 scale-[1.03]"
                  : "bg-muted/80 text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {value}
            </button>
          ))}
        </div>

        {/* Custom date range picker */}
        {granularity === "custom" && (
          <div className="flex flex-wrap items-center gap-2 animate-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-2 shadow-sm">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <label className="text-xs font-semibold text-muted-foreground">From</label>
              <input
                type="month"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="bg-transparent border-none text-xs font-bold text-foreground focus:ring-0 outline-none cursor-pointer"
              />
            </div>
            <div className="flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-2 shadow-sm">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <label className="text-xs font-semibold text-muted-foreground">To</label>
              <input
                type="month"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="bg-transparent border-none text-xs font-bold text-foreground focus:ring-0 outline-none cursor-pointer"
              />
            </div>
          </div>
        )}

<div className="flex flex-wrap gap-2">
  {csvUrl ? (
    <a
      href={csvUrl}
      download={`expense-report-${granularity}.csv`}
      className="inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 text-xs font-bold text-primary-foreground shadow-lg shadow-primary/20 hover:opacity-90 hover:scale-[1.02] transition-all"
    >
      <Download className="h-4 w-4" aria-hidden />
      Export CSV
    </a>
  ) : (
    <button
      type="button"
      disabled
      className="inline-flex items-center gap-2 rounded-2xl bg-primary/30 px-5 py-3 text-xs font-bold text-primary-foreground opacity-50 cursor-not-allowed"
    >
      <Download className="h-4 w-4" aria-hidden />
      Export CSV
    </button>
  )}
  <button
    type="button"
    title="PDF export can reuse invoice templates when connected."
    className="inline-flex cursor-not-allowed items-center gap-2 rounded-2xl border border-dashed border-border px-5 py-3 text-xs font-bold text-muted-foreground opacity-80"
    disabled
  >
    <FileDown className="h-4 w-4" aria-hidden />
    Export PDF
  </button>
</div>
      </div>

      {error ? (
        <div className="rounded-2xl bg-destructive/10 p-4 border border-destructive/20">
          <p className="text-sm font-medium text-destructive">{error}</p>
        </div>
      ) : null}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : null}

      {!loading && periods.length > 0 && (
        <>
          {/* ── 1. Key Insight Cards ── */}
          {insights && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  label: "Total Net Profit",
                  value: formatInrSigned(insights.netSavings),
                  sub: "Accumulated across period",
                  icon: insights.netSavings >= 0 ? TrendingUp : TrendingDown,
                  accent: insights.netSavings >= 0
                    ? "bg-green-500/15 text-green-600 dark:text-green-400"
                    : "bg-orange-500/15 text-orange-600 dark:text-orange-400",
                },
                {
                  label: "Savings Rate",
                  value: `${insights.savingsRate.toFixed(1)}%`,
                  sub: insights.savingsRate >= 0 ? "Net surplus of income saved" : "Expenses exceed income",
                  icon: Percent,
                  accent: "bg-primary/15 text-primary",
                },
                {
                  label: "Avg Period Expenses",
                  value: formatInr(insights.avgExpenses),
                  sub: `Average spending per period`,
                  icon: ArrowDownRight,
                  accent: "bg-orange-500/15 text-orange-600 dark:text-orange-400",
                },
                {
                  label: "Highest Burn Period",
                  value: insights.maxExpensePeriod || "N/A",
                  sub: `Spent ${formatInr(insights.maxExpense)}`,
                  icon: Flame,
                  accent: "bg-red-500/15 text-red-600 dark:text-red-400",
                },
              ].map(({ label, value, sub, icon: Icon, accent }) => (
                <div
                  key={label}
                  className="rounded-2xl border border-border bg-card/60 backdrop-blur-sm p-6 shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-300 group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{label}</span>
                    <span className={`rounded-xl p-2 transition-transform group-hover:scale-110 ${accent}`}>
                      <Icon className="h-4 w-4" />
                    </span>
                  </div>
                  <div className="mt-4">
                    <h3 className="text-2xl font-bold tracking-tight text-foreground tabular-nums truncate" title={value}>
                      {value}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">{sub}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Dynamic Anomaly Thresholds ── */}
          {anomalyData && (() => {
            const { min, avg, max } = anomalyData.range;
            const useCustom = anomalyData.customAnomalyThreshold != null;
            const activeUpperLimit = useCustom ? anomalyData.customAnomalyThreshold! : max;
            
            // Calculate proportional widths for the bar based on the active upper limit
            const totalRange = Math.max(activeUpperLimit * 1.3, avg + (activeUpperLimit - avg) * 1.5) || 1;
            const normalPct = Math.min(95, Math.max(20, (activeUpperLimit / totalRange) * 100));
            const avgPct = Math.min(normalPct - 2, Math.max(5, (avg / totalRange) * 100));
            
            // Count anomalous invoices using the active limit
            const anomalyCount = anomalyData.trends?.filter?.((t: any) => t.amount > activeUpperLimit)?.length ?? 0;

            return (
            <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <Flame className="w-5 h-5 text-orange-500" />
                    <h2 className="text-lg font-bold tracking-tight text-foreground heading-display">
                      Anomaly Detection
                    </h2>
                    {/* Info tooltip */}
                    <div className="relative group/info">
                      <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center cursor-help text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors">
                        <span className="text-[10px] font-bold">ℹ</span>
                      </div>
                      <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 p-3 rounded-xl bg-card border border-border shadow-xl text-xs text-muted-foreground opacity-0 invisible group-hover/info:opacity-100 group-hover/info:visible transition-all duration-200 z-20 pointer-events-none">
                        <p className="font-bold text-foreground mb-1">How this works</p>
                        <p>Any invoice amount above the <strong>Upper Limit</strong> will be flagged as unusual. You can let our system calculate this automatically based on your history, or set your own custom limit.</p>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Identify unusually high expenses that require your review.
                  </p>
                </div>

                {/* Anomaly count badge + link */}
                {anomalyCount > 0 && (
                  <a
                    href="/dashboard/invoices?status=PAID"
                    className="inline-flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-500/15 transition-colors shrink-0"
                  >
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                    </span>
                    {anomalyCount} Anomalous Invoice{anomalyCount !== 1 ? 's' : ''} Detected
                  </a>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-secondary/30 p-4 rounded-xl border border-border/50">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Average Invoice</p>
                  <p className="text-xl font-bold text-foreground tabular-nums">{formatInr(avg)}</p>
                </div>

                {/* Upper Limit Card with Toggle */}
                <div className={`p-4 rounded-xl border transition-colors ${useCustom ? "bg-primary/5 border-primary/20" : "bg-secondary/30 border-border/50"}`}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                      Upper Limit
                      <span className={`px-1.5 py-0.5 rounded text-[9px] ${useCustom ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}>
                        {useCustom ? "CUSTOM" : "AUTO"}
                      </span>
                    </p>
                    {!isEditingCustom && (
                      <button 
                        onClick={() => {
                          setCustomThresholdInput(activeUpperLimit.toString());
                          setIsEditingCustom(true);
                        }}
                        className="text-muted-foreground hover:text-primary transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {isEditingCustom ? (
                    <div className="flex items-center gap-2 mt-1">
                      <div className="relative flex-1">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground font-medium text-sm">₹</span>
                        <input 
                          type="number" 
                          value={customThresholdInput}
                          onChange={(e) => setCustomThresholdInput(e.target.value)}
                          className="w-full bg-background border border-border rounded-lg pl-6 pr-2 py-1 text-sm font-bold focus:outline-none focus:ring-1 focus:ring-primary"
                          autoFocus
                          disabled={isSavingThreshold}
                        />
                      </div>
                      <button 
                        onClick={() => saveCustomThreshold(customThresholdInput)}
                        disabled={isSavingThreshold}
                        className="p-1.5 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50"
                      >
                        {isSavingThreshold ? <div className="w-3.5 h-3.5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      </button>
                      <button 
                        onClick={() => {
                          setIsEditingCustom(false);
                          if (useCustom) saveCustomThreshold(null); // Revert to auto if they clear it
                        }}
                        disabled={isSavingThreshold}
                        className="p-1.5 bg-muted text-muted-foreground hover:text-foreground rounded-lg disabled:opacity-50"
                        title="Revert to Auto-calculated"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <p className="text-xl font-bold text-orange-500 tabular-nums">{formatInr(activeUpperLimit)}</p>
                  )}
                </div>

                <div className="bg-secondary/30 p-4 rounded-xl border border-border/50">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Lower Range</p>
                  <p className="text-xl font-bold text-green-500 tabular-nums">{formatInr(min)}</p>
                </div>
              </div>

              {/* Proportional visualizer bar */}
              <div className="h-5 w-full bg-secondary rounded-full overflow-hidden flex relative">
                <div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-green-500/60 to-green-500/80 transition-all duration-500"
                  style={{ width: `${normalPct}%` }}
                  title={`Normal Range: ${formatInr(min)} — ${formatInr(activeUpperLimit)}`}
                />
                <div
                  className="absolute inset-y-0 bg-gradient-to-r from-orange-500/70 to-orange-500/90 transition-all duration-500"
                  style={{ left: `${normalPct}%`, width: `${100 - normalPct}%` }}
                  title="Anomaly Range"
                />
                {/* Average marker */}
                <div
                  className="absolute inset-y-0 w-0.5 bg-foreground z-10 shadow-sm transition-all duration-500"
                  style={{ left: `${avgPct}%` }}
                  title={`Average: ${formatInr(avg)}`}
                >
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] font-bold text-muted-foreground whitespace-nowrap">
                    AVG
                  </div>
                </div>
                {/* Upper limit marker */}
                <div
                  className="absolute inset-y-0 w-0.5 bg-orange-600 z-10 transition-all duration-500"
                  style={{ left: `${normalPct}%` }}
                  title={`Upper Limit: ${formatInr(activeUpperLimit)}`}
                />
              </div>
              <div className="flex justify-between mt-2.5 text-[10px] font-bold text-muted-foreground uppercase">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-green-500/80" />
                  Normal Spread ({formatInr(min)} — {formatInr(activeUpperLimit)})
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-orange-500/80" />
                  Anomalous ({`> ${formatInr(activeUpperLimit)}`})
                </span>
              </div>
            </section>
            );
          })()}

          {/* ── 2. Financial Trend Chart ── */}
          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="flex flex-col gap-1 mb-6">
              <h2 className="text-lg font-bold tracking-tight text-foreground heading-display">
                Financial Trends &amp; Cash Flow
              </h2>
              <p className="text-xs text-muted-foreground">Income, expenses, and net profit margins over time</p>
            </div>
            <div className="h-[320px] w-full min-h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="anaIncomeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.15} />
                    </linearGradient>
                    <linearGradient id="anaExpGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0.15} />
                    </linearGradient>
                    <filter id="anaGlow" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="3" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                  <XAxis dataKey="period" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={{ stroke: "var(--border)" }} tickLine={false} />
                  <YAxis tickFormatter={(v) => typeof v === "number" && Math.abs(v) >= 1000 ? `₹${Math.round(v / 1000)}k` : `₹${v}`} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<TrendTooltip />} cursor={{ fill: "var(--muted)", opacity: 0.15 }} />
                  <Legend wrapperStyle={{ fontSize: "11px", paddingTop: 16 }} formatter={(v) => {
                    if (v === "income") return <span className="font-semibold text-muted-foreground mr-3">Income</span>;
                    if (v === "expenses") return <span className="font-semibold text-muted-foreground mr-3">Expenses</span>;
                    if (v === "net") return <span className="font-bold text-foreground">Net Profit</span>;
                    return v;
                  }} />
                  <Bar dataKey="income" name="income" fill="url(#anaIncomeGrad)" radius={[6, 6, 0, 0]} maxBarSize={32} />
                  <Bar dataKey="expenses" name="expenses" fill="url(#anaExpGrad)" radius={[6, 6, 0, 0]} maxBarSize={32} />
                  <Line type="monotone" dataKey="net" name="net" stroke="#10b981" strokeWidth={3} filter="url(#anaGlow)" dot={{ r: 4, strokeWidth: 2, fill: "var(--card)" }} activeDot={{ r: 6, fill: "#10b981" }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* ── 3. Two-column: Cumulative Chart + Top 5 Categories ── */}
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
            {/* Cumulative Area Chart */}
            <section className="xl:col-span-3 rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="flex flex-col gap-1 mb-6">
                <h2 className="text-lg font-bold tracking-tight text-foreground heading-display">
                  Cumulative Cash Flow
                </h2>
                <p className="text-xs text-muted-foreground">Running totals reveal acceleration or deceleration in growth</p>
              </div>
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={cumulativeData} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="cumIncGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="cumExpGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
                    <XAxis dataKey="period" tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} axisLine={{ stroke: "var(--border)" }} tickLine={false} />
                    <YAxis tickFormatter={(v) => typeof v === "number" && Math.abs(v) >= 1000 ? `₹${Math.round(v / 1000)}k` : `₹${v}`} tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CumulativeTooltip />} cursor={{ stroke: "var(--border)", strokeWidth: 1 }} />
                    <Legend wrapperStyle={{ fontSize: "11px", paddingTop: 12 }} formatter={(v) => {
                      if (v === "cumIncome") return <span className="font-semibold text-muted-foreground mr-3">Cumulative Income</span>;
                      if (v === "cumExpenses") return <span className="font-semibold text-muted-foreground">Cumulative Expenses</span>;
                      return v;
                    }} />
                    <Area type="monotone" dataKey="cumIncome" name="cumIncome" stroke="var(--primary)" strokeWidth={2.5} fill="url(#cumIncGrad)" dot={false} />
                    <Area type="monotone" dataKey="cumExpenses" name="cumExpenses" stroke="#f97316" strokeWidth={2.5} fill="url(#cumExpGrad)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </section>

            {/* Top 5 Expense Categories */}
            <section className="xl:col-span-2 rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="flex flex-col gap-1 mb-6">
                <h2 className="text-lg font-bold tracking-tight text-foreground heading-display">
                  Top 5 Categories
                </h2>
                <p className="text-xs text-muted-foreground">Biggest expense categories this month</p>
              </div>
              {categoryData.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">No expense category data available yet.</p>
              ) : (
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      layout="vertical"
                      data={categoryData}
                      margin={{ top: 0, right: 8, left: 8, bottom: 0 }}
                      barCategoryGap="20%"
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-border/40" />
                      <XAxis
                        type="number"
                        tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) => `₹${Math.round(v / 1000)}k`}
                      />
                      <YAxis
                        type="category"
                        dataKey="category"
                        tick={{ fill: "var(--muted-foreground)", fontSize: 11, fontWeight: 600 }}
                        axisLine={false}
                        tickLine={false}
                        width={80}
                      />
                      <Tooltip content={<CategoryTooltip />} cursor={{ fill: "var(--muted)", opacity: 0.15 }} />
                      <Bar dataKey="amount" radius={[0, 6, 6, 0]} maxBarSize={20}>
                        {categoryData.map((_, i) => (
                          <Cell key={i} fill={CAT_COLORS[i % CAT_COLORS.length]} fillOpacity={0.85} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </section>
          </div>

          {/* ── 4. Cash Flow Waterfall Chart ── */}
          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="flex flex-col gap-1 mb-6">
              <h2 className="text-lg font-bold tracking-tight text-foreground heading-display">
                Cash Flow Waterfall
              </h2>
              <p className="text-xs text-muted-foreground">
                See the step-by-step contribution of each period to your total net cash flow
              </p>
            </div>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={waterfallData}
                  margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} axisLine={{ stroke: "var(--border)" }} tickLine={false} />
                  <YAxis tickFormatter={(v) => typeof v === "number" && Math.abs(v) >= 1000 ? `₹${Math.round(v / 1000)}k` : `₹${v}`} tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<WaterfallTooltip />} cursor={{ fill: "var(--muted)", opacity: 0.15 }} />
                  <ReferenceLine y={0} stroke="var(--border)" strokeDasharray="4 4" />

                  {/* Invisible baseline bar to simulate waterfall positioning */}
                  <Bar dataKey="start" stackId="waterfall" fill="transparent" radius={0} />
                  <Bar
                    dataKey="value"
                    stackId="waterfall"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={36}
                  >
                    {waterfallData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          entry.isTotal
                            ? "var(--primary)"
                            : entry.isPositive
                            ? "#10b981"
                            : "#f97316"
                        }
                        fillOpacity={entry.isTotal ? 1 : 0.8}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center gap-6 mt-4 justify-center">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-sm bg-emerald-500" />
                <span className="text-xs text-muted-foreground font-medium">Surplus period</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-sm bg-orange-500" />
                <span className="text-xs text-muted-foreground font-medium">Deficit period</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-sm bg-primary" />
                <span className="text-xs text-muted-foreground font-medium">Total net</span>
              </div>
            </div>
          </section>

          {/* ── 5. Heatmap Calendar ── */}
          <SpendHeatmap />

          {/* ── 6. Detailed Data Table ── */}
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-muted/40">
                <tr>
                  <th className="px-6 py-4 font-semibold text-muted-foreground uppercase tracking-wider text-xs">Period</th>
                  <th className="px-6 py-4 text-right font-semibold text-muted-foreground uppercase tracking-wider text-xs">Income</th>
                  <th className="px-6 py-4 text-right font-semibold text-muted-foreground uppercase tracking-wider text-xs">Expenses</th>
                  <th className="px-6 py-4 text-right font-semibold text-muted-foreground uppercase tracking-wider text-xs">Net Cash Flow</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {periods.map((r) => {
                  const net = r.income - r.expenses;
                  return (
                    <tr key={r.period} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 font-bold text-foreground">{r.period}</td>
                      <td className="px-6 py-4 text-right font-semibold tabular-nums text-green-600 dark:text-green-400">{formatInr(r.income)}</td>
                      <td className="px-6 py-4 text-right font-semibold tabular-nums text-orange-600 dark:text-orange-400">{formatInr(r.expenses)}</td>
                      <td className={`px-6 py-4 text-right font-bold tabular-nums ${net >= 0 ? "text-green-600 dark:text-green-400" : "text-orange-600 dark:text-orange-400"}`}>
                        {formatInrSigned(net)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {!loading && periods.length === 0 && granularity !== "custom" && (
        <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center shadow-sm">
          <p className="text-sm text-muted-foreground">
            No ledger data in range yet. Add entries from the Overview tab.
          </p>
        </div>
      )}

      {!loading && granularity === "custom" && (!fromDate || !toDate) && (
        <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center shadow-sm">
          <Calendar className="h-10 w-10 text-muted-foreground/40 mx-auto mb-4" />
          <p className="text-sm font-medium text-foreground">Select a date range</p>
          <p className="text-xs text-muted-foreground mt-1">Choose "From" and "To" months above to load custom data.</p>
        </div>
      )}

      {/* Heatmap in standalone mode when no period data (always show for custom / empty) */}
      {!loading && periods.length === 0 && (
        <SpendHeatmap />
      )}

      <p className="text-xs text-center text-muted-foreground">
        Report uses ledger entries from roughly the last three years, aggregated by UTC calendar periods.
      </p>
    </div>
  );
}
