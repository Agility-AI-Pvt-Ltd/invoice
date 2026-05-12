"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatInr } from "../_lib/format";

export type IncomeExpenseChartDatum = {
  month: string;
  income: number;
  expenses: number;
};

export function IncomeExpenseChart({ data }: { data: IncomeExpenseChartDatum[] }) {
  return (
    <div className="h-[280px] w-full min-h-[240px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border/60" />
          <XAxis
            dataKey="month"
            tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
            axisLine={{ stroke: "var(--border)" }}
            tickLine={false}
          />
          <YAxis
            tickFormatter={(v) =>
              typeof v === "number" && v >= 100000
                ? `${Math.round(v / 1000)}k`
                : String(v)
            }
            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: "var(--muted)", opacity: 0.35 }}
            contentStyle={{
              backgroundColor: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: "12px",
              fontSize: "12px",
            }}
            formatter={(value, name) => {
              const v = typeof value === "number" ? value : Number(value ?? 0);
              const label = name === "income" ? "Income" : "Expenses";
              return [formatInr(v), label];
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: "12px", paddingTop: 12 }}
            formatter={(value) =>
              value === "income" ? "Income" : value === "expenses" ? "Expenses" : value
            }
          />
          <Bar
            dataKey="income"
            name="income"
            fill="var(--primary)"
            radius={[6, 6, 0, 0]}
            maxBarSize={28}
          />
          <Bar
            dataKey="expenses"
            name="expenses"
            fill="#f97316"
            radius={[6, 6, 0, 0]}
            maxBarSize={28}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
