"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { AlertTriangle, Clock, ShieldAlert } from "lucide-react";

type AgingBucket = {
  label: string;
  count: number;
  amount: number;
  color: string;
};

const ICONS = [Clock, AlertTriangle, ShieldAlert];

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload as AgingBucket;
  return (
    <div className="backdrop-blur-xl bg-card/90 border border-border/80 p-4 rounded-2xl shadow-xl animate-in fade-in duration-200 min-w-[160px]">
      <p className="text-xs font-bold text-foreground">{d.label}</p>
      <div className="space-y-1 mt-2">
        <div className="flex items-center justify-between gap-6">
          <span className="text-xs text-muted-foreground">Invoices</span>
          <span className="text-xs font-bold text-foreground tabular-nums">
            {d.count}
          </span>
        </div>
        <div className="flex items-center justify-between gap-6">
          <span className="text-xs text-muted-foreground">Total</span>
          <span className="text-xs font-bold text-foreground tabular-nums">
            ₹{d.amount.toLocaleString("en-IN")}
          </span>
        </div>
      </div>
    </div>
  );
};

export function InvoiceAgingChart({ buckets }: { buckets: AgingBucket[] }) {
  const totalCount = buckets.reduce((s, b) => s + b.count, 0);
  const totalAmount = buckets.reduce((s, b) => s + b.amount, 0);

  if (totalCount === 0) {
    return null;
  }

  return (
    <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden animate-in fade-in duration-500">
      <div className="px-6 py-5 border-b border-border/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-secondary/20">
        <div>
          <h2 className="font-bold heading-display flex items-center gap-2 text-foreground">
            <ShieldAlert className="w-4 h-4 text-amber-500" />
            Invoice Aging
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Unpaid invoices grouped by days past due date
          </p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs font-bold text-muted-foreground">
            {totalCount} invoice{totalCount !== 1 ? "s" : ""} · ₹
            {totalAmount.toLocaleString("en-IN")} outstanding
          </span>
        </div>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Stat cards */}
          <div className="md:col-span-1 space-y-3">
            {buckets.map((bucket, i) => {
              const Icon = ICONS[i] ?? Clock;
              return (
                <div
                  key={bucket.label}
                  className="p-4 rounded-xl border border-border/50 bg-secondary/20 hover:bg-secondary/40 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="w-3.5 h-3.5" style={{ color: bucket.color }} />
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      {bucket.label}
                    </span>
                  </div>
                  <p className="text-lg font-bold text-foreground tabular-nums">
                    {bucket.count}
                  </p>
                  <p className="text-xs text-muted-foreground tabular-nums">
                    ₹{bucket.amount.toLocaleString("en-IN")}
                  </p>
                </div>
              );
            })}
          </div>
          {/* Bar chart */}
          <div className="md:col-span-3 h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={buckets}
                margin={{ top: 8, right: 8, left: -10, bottom: 0 }}
              >
                <XAxis
                  dataKey="label"
                  tick={{
                    fill: "var(--muted-foreground)",
                    fontSize: 11,
                    fontWeight: 600,
                  }}
                  axisLine={{ stroke: "var(--border)" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{
                    fill: "var(--muted-foreground)",
                    fontSize: 10,
                  }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) =>
                    typeof v === "number" && v >= 1000
                      ? `₹${Math.round(v / 1000)}k`
                      : `₹${v}`
                  }
                />
                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{ fill: "var(--muted)", opacity: 0.15 }}
                />
                <Bar
                  dataKey="amount"
                  radius={[8, 8, 0, 0]}
                  maxBarSize={60}
                  animationDuration={800}
                >
                  {buckets.map((b, i) => (
                    <Cell key={i} fill={b.color} fillOpacity={0.85} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
