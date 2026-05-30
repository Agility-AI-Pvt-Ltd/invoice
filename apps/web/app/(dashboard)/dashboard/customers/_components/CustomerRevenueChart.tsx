"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Crown } from "lucide-react";

type CustomerData = { name: string; revenue: number; invoiceCount: number };

const COLORS = [
  "#10b981",
  "#3b82f6",
  "#8b5cf6",
  "#f97316",
  "#f43f5e",
  "#06b6d4",
  "#84cc16",
  "#ec4899",
  "#eab308",
  "#6366f1",
];

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload as CustomerData;
  return (
    <div className="backdrop-blur-xl bg-card/90 border border-border/80 p-4 rounded-2xl shadow-xl animate-in fade-in duration-200 min-w-[160px]">
      <p className="text-xs font-bold text-foreground">{d.name}</p>
      <div className="space-y-1.5 mt-2">
        <div className="flex items-center justify-between gap-6">
          <span className="text-xs text-muted-foreground">Revenue</span>
          <span className="text-xs font-bold text-foreground tabular-nums">
            ₹{d.revenue.toLocaleString("en-IN")}
          </span>
        </div>
        <div className="flex items-center justify-between gap-6">
          <span className="text-xs text-muted-foreground">Invoices</span>
          <span className="text-xs font-bold text-foreground tabular-nums">
            {d.invoiceCount}
          </span>
        </div>
      </div>
    </div>
  );
};

export function CustomerRevenueChart({ data }: { data: CustomerData[] }) {
  if (data.length === 0) {
    return null;
  }

  const maxRevenue = Math.max(...data.map((d) => d.revenue));

  return (
    <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden animate-in fade-in duration-500">
      <div className="px-6 py-5 border-b border-border/50 flex items-center justify-between bg-secondary/20">
        <h2 className="font-bold heading-display flex items-center gap-2 text-foreground">
          <Crown className="w-4 h-4 text-amber-500" />
          Revenue Leaderboard
        </h2>
        <span className="inline-flex items-center rounded-full border border-border bg-muted/50 px-3 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
          Top {data.length} · Paid Invoices
        </span>
      </div>
      <div className="p-6">
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={data}
              margin={{ top: 4, right: 16, left: 4, bottom: 4 }}
              barCategoryGap="18%"
            >
              <CartesianGrid
                strokeDasharray="3 3"
                horizontal={false}
                className="stroke-border/40"
              />
              <XAxis
                type="number"
                tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) =>
                  typeof v === "number" && v >= 1000
                    ? `₹${Math.round(v / 1000)}k`
                    : `₹${v}`
                }
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{
                  fill: "var(--muted-foreground)",
                  fontSize: 11,
                  fontWeight: 600,
                }}
                axisLine={false}
                tickLine={false}
                width={100}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: "var(--muted)", opacity: 0.15 }}
              />
              <Bar dataKey="revenue" radius={[0, 8, 8, 0]} maxBarSize={24}>
                {data.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={COLORS[i % COLORS.length]}
                    fillOpacity={
                      entry.revenue === maxRevenue ? 1 : 0.7
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
