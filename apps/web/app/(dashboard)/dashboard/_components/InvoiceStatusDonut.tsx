"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

type StatusSlice = { status: string; count: number; color: string };

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  SENT: "Sent",
  PARTIALLY_PAID: "Partial",
  PAID: "Paid",
  OVERDUE: "Overdue",
  CANCELLED: "Cancelled",
};

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="backdrop-blur-xl bg-card/90 border border-border/80 p-3 rounded-2xl shadow-xl animate-in fade-in duration-200">
      <div className="flex items-center gap-2">
        <span
          className="h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: d.color }}
        />
        <span className="text-xs font-bold text-foreground">
          {STATUS_LABELS[d.status] ?? d.status}
        </span>
      </div>
      <p className="text-xs text-muted-foreground mt-1 tabular-nums">
        {d.count} invoice{d.count !== 1 ? "s" : ""}
      </p>
    </div>
  );
};

export function InvoiceStatusDonut({ data }: { data: StatusSlice[] }) {
  const total = data.reduce((s, d) => s + d.count, 0);

  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-[200px] text-sm text-muted-foreground">
        No invoices yet.
      </div>
    );
  }

  return (
    <div className="h-[220px] w-full relative">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="count"
            nameKey="status"
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={85}
            paddingAngle={3}
            strokeWidth={0}
            animationBegin={0}
            animationDuration={800}
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} opacity={0.9} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      {/* Center label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-2xl font-bold text-foreground tabular-nums">{total}</span>
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
          Total
        </span>
      </div>
    </div>
  );
}
