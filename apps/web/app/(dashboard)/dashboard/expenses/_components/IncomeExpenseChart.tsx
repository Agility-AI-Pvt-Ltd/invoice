"use client";

import { useMemo } from "react";
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
} from "recharts";
import { formatInr, formatInrSigned } from "../_lib/format";

export type IncomeExpenseChartDatum = {
  month: string;
  income: number;
  expenses: number;
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const income = payload.find((p: any) => p.dataKey === "income")?.value ?? 0;
    const expenses = payload.find((p: any) => p.dataKey === "expenses")?.value ?? 0;
    const net = income - expenses;

    return (
      <div className="backdrop-blur-xl bg-card/90 border border-border/80 p-4 rounded-2xl shadow-xl space-y-2 animate-in fade-in duration-200">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{label}</p>
        <div className="space-y-1.5 min-w-[140px]">
          <div className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-primary" />
              <span className="text-xs font-semibold text-muted-foreground">Income</span>
            </div>
            <span className="text-xs font-bold text-foreground tabular-nums">{formatInr(income)}</span>
          </div>
          <div className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-orange-500" />
              <span className="text-xs font-semibold text-muted-foreground">Expenses</span>
            </div>
            <span className="text-xs font-bold text-foreground tabular-nums">{formatInr(expenses)}</span>
          </div>
          <div className="border-t border-border/60 my-1 pt-1.5 flex items-center justify-between gap-6">
            <span className="text-xs font-bold text-foreground">Net Profit</span>
            <span
              className={`text-xs font-bold tabular-nums ${
                net >= 0 ? "text-green-600 dark:text-green-400" : "text-orange-600 dark:text-orange-400"
              }`}
            >
              {formatInrSigned(net)}
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export function IncomeExpenseChart({ data }: { data: IncomeExpenseChartDatum[] }) {
  // Enrich the data to include net profit/loss for the composed line
  const enrichedData = useMemo(() => {
    return data.map((d) => ({
      ...d,
      net: d.income - d.expenses,
    }));
  }, [data]);

  return (
    <div className="h-[280px] w-full min-h-[240px]">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={enrichedData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
          <defs>
            {/* Income Bar Gradient */}
            <linearGradient id="incomeBarGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.85} />
              <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.2} />
            </linearGradient>

            {/* Expense Bar Gradient */}
            <linearGradient id="expenseBarGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f97316" stopOpacity={0.85} />
              <stop offset="95%" stopColor="#f97316" stopOpacity={0.2} />
            </linearGradient>

            {/* Glowing filter for Net Profit Line */}
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
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
          <Legend
            wrapperStyle={{ fontSize: "11px", paddingTop: 14 }}
            formatter={(value) => {
              if (value === "income") return <span className="font-semibold text-muted-foreground mr-3">Income</span>;
              if (value === "expenses") return <span className="font-semibold text-muted-foreground mr-3">Expenses</span>;
              if (value === "net") return <span className="font-bold text-foreground">Net Cash Flow</span>;
              return value;
            }}
          />
          <Bar
            dataKey="income"
            name="income"
            fill="url(#incomeBarGrad)"
            radius={[6, 6, 0, 0]}
            maxBarSize={24}
          />
          <Bar
            dataKey="expenses"
            name="expenses"
            fill="url(#expenseBarGrad)"
            radius={[6, 6, 0, 0]}
            maxBarSize={24}
          />
          <Line
            type="monotone"
            dataKey="net"
            name="net"
            stroke="#10b981"
            strokeWidth={3}
            filter="url(#glow)"
            dot={{ r: 4, strokeWidth: 2, fill: "var(--card)" }}
            activeDot={{ r: 6, strokeWidth: 0, fill: "#10b981" }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

