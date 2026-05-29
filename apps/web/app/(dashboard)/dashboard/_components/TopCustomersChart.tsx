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

type CustomerRevenue = { name: string; revenue: number };

const COLORS = ["#10b981", "#3b82f6", "#f97316", "#8b5cf6", "#f43f5e"];

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="backdrop-blur-xl bg-card/90 border border-border/80 p-3 rounded-2xl shadow-xl animate-in fade-in duration-200">
      <p className="text-xs font-bold text-foreground">{d.name}</p>
      <p className="text-xs text-muted-foreground tabular-nums mt-1">
        ₹{d.revenue.toLocaleString("en-IN")}
      </p>
    </div>
  );
};

export function TopCustomersChart({ data }: { data: CustomerRevenue[] }) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[200px] text-sm text-muted-foreground">
        No customer revenue data yet.
      </div>
    );
  }

  return (
    <div className="h-[220px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          layout="vertical"
          data={data}
          margin={{ top: 4, right: 12, left: 4, bottom: 4 }}
          barCategoryGap="22%"
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
            tick={{ fill: "var(--muted-foreground)", fontSize: 11, fontWeight: 600 }}
            axisLine={false}
            tickLine={false}
            width={90}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ fill: "var(--muted)", opacity: 0.15 }}
          />
          <Bar dataKey="revenue" radius={[0, 6, 6, 0]} maxBarSize={22}>
            {data.map((_, i) => (
              <Cell
                key={i}
                fill={COLORS[i % COLORS.length]}
                fillOpacity={0.85}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
