"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type RevenueDataPoint = { month: string; revenue: number };

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const revenue = payload[0]?.value ?? 0;
  return (
    <div className="backdrop-blur-xl bg-card/90 border border-border/80 p-4 rounded-2xl shadow-xl animate-in fade-in duration-200 min-w-[140px]">
      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
        {label}
      </p>
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-emerald-500" />
        <span className="text-xs text-muted-foreground">Total Revenue</span>
        <span className="text-xs font-bold text-foreground tabular-nums ml-auto">
          ₹{revenue.toLocaleString("en-IN")}
        </span>
      </div>
    </div>
  );
};

export function RevenueAreaChart({ data }: { data: RevenueDataPoint[] }) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[200px] text-sm text-muted-foreground">
        No revenue data available yet.
      </div>
    );
  }

  return (
    <div className="h-[220px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
          <defs>
            <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
            <filter id="revGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
          <XAxis
            dataKey="month"
            tick={{ fill: "var(--muted-foreground)", fontSize: 10, fontWeight: 500 }}
            axisLine={{ stroke: "var(--border)" }}
            tickLine={false}
          />
          <YAxis
            tickFormatter={(v) =>
              typeof v === "number" && Math.abs(v) >= 1000
                ? `₹${Math.round(v / 1000)}k`
                : `₹${v}`
            }
            tick={{ fill: "var(--muted-foreground)", fontSize: 10, fontWeight: 500 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="#10b981"
            strokeWidth={2.5}
            fill="url(#revenueGrad)"
            filter="url(#revGlow)"
            dot={{ r: 4, fill: "var(--card)", strokeWidth: 2, stroke: "#10b981" }}
            activeDot={{ r: 6, fill: "#10b981", strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
