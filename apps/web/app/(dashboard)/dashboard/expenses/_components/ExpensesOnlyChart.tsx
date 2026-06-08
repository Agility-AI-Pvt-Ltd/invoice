"use client";

import {
  Bar,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ComposedChart,
} from "recharts";
import { formatInr } from "../_lib/format";

export type ExpensesOnlyChartDatum = {
  month: string;
  expenses: number;
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const expenses = payload.find((p: any) => p.dataKey === "expenses")?.value ?? 0;

    return (
      <div className="backdrop-blur-xl bg-card/90 border border-border/80 p-4 rounded-2xl shadow-xl space-y-2 animate-in fade-in duration-200">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{label}</p>
        <div className="space-y-1.5 min-w-[140px]">
          <div className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-orange-500" />
              <span className="text-xs font-semibold text-muted-foreground">Expenses</span>
            </div>
            <span className="text-xs font-bold text-foreground tabular-nums">{formatInr(expenses)}</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export function ExpensesOnlyChart({ data }: { data: ExpensesOnlyChartDatum[] }) {
  return (
    <div className="h-[280px] w-full min-h-[240px]">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
          <defs>
            {/* Expense Bar Gradient */}
            <linearGradient id="expenseBarGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f97316" stopOpacity={0.85} />
              <stop offset="95%" stopColor="#f97316" stopOpacity={0.2} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
          <XAxis
            dataKey="month"
            tick={{ fill: "var(--muted-foreground)", fontSize: 11, fontWeight: 500 }}
            axisLine={{ stroke: "var(--border)" }}
            tickLine={false}
          />
          <YAxis
            tickFormatter={(v) => {
              if (typeof v !== "number") return String(v);
              const inRupees = v / 100;
              return Math.abs(inRupees) >= 1000
                ? `₹${Math.round(inRupees / 1000)}k`
                : `₹${inRupees}`;
            }}
            tick={{ fill: "var(--muted-foreground)", fontSize: 10, fontWeight: 500 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--muted)", opacity: 0.15 }} />
          <Bar
            dataKey="expenses"
            name="expenses"
            fill="url(#expenseBarGrad)"
            radius={[6, 6, 0, 0]}
            maxBarSize={24}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
