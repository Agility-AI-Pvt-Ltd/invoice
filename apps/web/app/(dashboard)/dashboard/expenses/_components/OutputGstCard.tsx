"use client";

import { Percent } from "lucide-react";

export type GstBreakdownLabels = {
  cgst: string;
  sgst: string;
  igst: string;
};

const GST_ROWS: { key: keyof GstBreakdownLabels; label: string }[] = [
  { key: "cgst", label: "CGST" },
  { key: "sgst", label: "SGST" },
  { key: "igst", label: "IGST" },
];

function GstBreakdownPanel({ breakdown }: { breakdown: GstBreakdownLabels }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-lg">
      <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        GST Breakdown
      </p>
      <div className="space-y-2">
        {GST_ROWS.map(({ key, label }) => (
          <div key={key} className="flex items-center justify-between text-xs">
            <span className="font-medium text-muted-foreground">{label}</span>
            <span className="font-bold tabular-nums text-foreground">{breakdown[key]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function OutputGstCard({
  totalFormatted,
  breakdownFormatted,
  className,
}: {
  totalFormatted: string;
  breakdownFormatted: GstBreakdownLabels;
  className?: string;
}) {
  return (
    <div className={`h-full ${className ?? ""}`}>
      <div
        className="group relative z-0 h-full hover:z-30 focus-within:z-30"
        tabIndex={0}
        aria-label="Output GST — hover for breakdown"
      >
        <div className="relative h-full cursor-default overflow-hidden rounded-3xl border border-primary/20 bg-card p-5 shadow-sm transition-all group-hover:-translate-y-1 group-hover:shadow-xl group-focus-within:-translate-y-1 group-focus-within:shadow-xl">
          <div className="absolute top-0 right-0 -mr-10 -mt-10 h-20 w-20 rounded-bl-full bg-primary/10 transition-transform group-hover:scale-125" />
          <Percent className="relative mb-4 h-5 w-5 text-primary" aria-hidden />
          <p className="relative text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Output GST
          </p>
          <p className="relative mt-1 text-2xl font-bold tracking-tight text-foreground">
            {totalFormatted}
          </p>
          <p className="relative mt-1.5 min-h-[15px] text-[10px] text-muted-foreground">
            total GST this month
          </p>
        </div>

        <div
          className="pointer-events-none absolute inset-x-3 top-[calc(100%-0.75rem)] z-20 translate-y-2 opacity-0 transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100"
          role="tooltip"
        >
          <GstBreakdownPanel breakdown={breakdownFormatted} />
        </div>
      </div>
    </div>
  );
}
