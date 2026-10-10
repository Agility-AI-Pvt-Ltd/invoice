"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { formatInr } from "../_lib/format";
import type { BreakdownRow } from "@/lib/expenses/breakdown";

export type { BreakdownRow };

// Vibrant, cohesive color scheme matching the dashboard's design aesthetics
const COLORS = [
  "var(--primary)",
  "#f97316", // orange
  "#f43f5e", // rose
  "#3b82f6", // blue
  "#10b981", // emerald
  "#8b5cf6", // violet
  "#fbbf24", // amber
];

const CustomPieTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="backdrop-blur-xl bg-card/90 border border-border/80 p-3 rounded-2xl shadow-xl space-y-1 animate-in fade-in duration-200">
        <p className="text-xs font-bold text-foreground">{data.category}</p>
        <p className="text-xs font-semibold text-muted-foreground">
          {formatInr(data.amount)} ({(data.fraction * 100).toFixed(1)}%)
        </p>
      </div>
    );
  }
  return null;
};

export function ExpenseBreakdownList({ rows }: { rows: BreakdownRow[] }) {
  // Normalize fractions to sum to 1.0 for displaying accurate percentages
  const total = rows.reduce((acc, row) => acc + row.amount, 0);
  const pieData = rows.map((row, idx) => ({
    ...row,
    percentage: total > 0 ? (row.amount / total) * 100 : 0,
    color: COLORS[idx % COLORS.length] ?? "var(--primary)",
  }));

  return (
    <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
      {/* Interactive Donut Chart */}
      <div className="h-[180px] w-full max-w-[180px] shrink-0 mx-auto sm:mx-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={75}
              paddingAngle={3}
              dataKey="amount"
              nameKey="category"
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke="var(--card)" strokeWidth={2} />
              ))}
            </Pie>
            <Tooltip content={<CustomPieTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Categories breakdown details */}
      <ul className="flex-1 space-y-3.5 min-w-0">
        {pieData.map((row) => (
          <li key={row.category} className="group">
            <div className="flex items-center justify-between gap-3 text-sm">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full transition-transform group-hover:scale-125"
                  style={{ backgroundColor: row.color }}
                />
                <span className="font-semibold text-foreground truncate">{row.category}</span>
              </div>
              <div className="shrink-0 flex items-center gap-2 font-bold tabular-nums">
                <span className="text-foreground">{formatInr(row.amount)}</span>
                <span className="text-xs text-muted-foreground font-medium">({row.percentage.toFixed(0)}%)</span>
              </div>
            </div>
            {/* Visual background progress indicator */}
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted/60">
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${row.percentage}%`,
                  backgroundColor: row.color,
                }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

