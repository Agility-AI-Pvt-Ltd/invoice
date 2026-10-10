"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Percent } from "lucide-react";
import type { GstBreakdownLabels, GstMonthOption } from "@/lib/expenses/gst-months";

export type { GstMonthOption };

const GST_ROWS: { key: keyof GstBreakdownLabels; label: string }[] = [
  { key: "cgst", label: "CGST" },
  { key: "sgst", label: "SGST" },
  { key: "igst", label: "IGST" },
];

function GstBreakdownPanel({
  breakdown,
  months,
  selectedMonthKey,
  onMonthChange,
}: {
  breakdown: GstBreakdownLabels;
  months: GstMonthOption[];
  selectedMonthKey: string;
  onMonthChange: (monthKey: string) => void;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-lg">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          GST Breakdown
        </p>
        {months.length > 1 ? (
          <div className="relative shrink-0">
            <select
              value={selectedMonthKey}
              onChange={(e) => onMonthChange(e.target.value)}
              className="appearance-none rounded-lg border border-border bg-muted/40 py-1 pl-2 pr-6 text-[10px] font-semibold text-foreground outline-none focus:border-primary/40"
              aria-label="Select month for GST breakdown"
            >
              {[...months].reverse().map((month) => (
                <option key={month.monthKey} value={month.monthKey}>
                  {month.label}
                  {month.isCurrent ? " (current)" : ""}
                </option>
              ))}
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-1.5 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
          </div>
        ) : null}
      </div>
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
  months,
  defaultMonthKey,
  className,
}: {
  months: GstMonthOption[];
  defaultMonthKey?: string;
  className?: string;
}) {
  const initialMonthKey =
    defaultMonthKey ??
    months.find((m) => m.isCurrent)?.monthKey ??
    months.at(-1)?.monthKey ??
    "";

  const [selectedMonthKey, setSelectedMonthKey] = useState(initialMonthKey);
  const [panelOpen, setPanelOpen] = useState(false);

  const selectedMonth = useMemo(
    () => months.find((m) => m.monthKey === selectedMonthKey) ?? months.at(-1),
    [months, selectedMonthKey],
  );

  if (!selectedMonth) return null;

  const subtitle = selectedMonth.isCurrent
    ? "total GST this month"
    : `total GST · ${selectedMonth.label}`;

  return (
    <div className={`h-full ${className ?? ""}`}>
      <div
        className="relative z-0 h-full hover:z-30 focus-within:z-30"
        onMouseEnter={() => setPanelOpen(true)}
        onMouseLeave={() => setPanelOpen(false)}
        onFocus={() => setPanelOpen(true)}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
            setPanelOpen(false);
          }
        }}
      >
        <div
          className="relative h-full cursor-default overflow-hidden rounded-3xl border border-primary/20 bg-card p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl focus-within:-translate-y-1 focus-within:shadow-xl"
          tabIndex={0}
          aria-label="Output GST — hover for breakdown"
        >
          <div className="absolute top-0 right-0 -mr-10 -mt-10 h-20 w-20 rounded-bl-full bg-primary/10 transition-transform hover:scale-125" />
          <Percent className="relative mb-4 h-5 w-5 text-primary" aria-hidden />
          <p className="relative text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Output GST
          </p>
          <p className="relative mt-1 text-2xl font-bold tracking-tight text-foreground">
            {selectedMonth.totalFormatted}
          </p>
          <p className="relative mt-1.5 min-h-[15px] text-[10px] text-muted-foreground">{subtitle}</p>
        </div>

        <div
          className={`absolute inset-x-3 top-[calc(100%-0.75rem)] z-20 transition-all duration-200 ${
            panelOpen
              ? "pointer-events-auto translate-y-0 opacity-100"
              : "pointer-events-none translate-y-2 opacity-0"
          }`}
          role="tooltip"
        >
          <GstBreakdownPanel
            breakdown={selectedMonth.breakdownFormatted}
            months={months}
            selectedMonthKey={selectedMonthKey}
            onMonthChange={setSelectedMonthKey}
          />
        </div>
      </div>
    </div>
  );
}
