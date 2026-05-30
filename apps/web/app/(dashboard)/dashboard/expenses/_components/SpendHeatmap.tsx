"use client";

import { useEffect, useMemo, useState } from "react";
import { formatInr } from "../_lib/format";

type DayData = { date: string; amount: number };

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

function getIntensity(amount: number, max: number): 0 | 1 | 2 | 3 | 4 {
  if (amount === 0 || max === 0) return 0;
  const ratio = amount / max;
  if (ratio < 0.15) return 1;
  if (ratio < 0.35) return 2;
  if (ratio < 0.65) return 3;
  return 4;
}

const INTENSITY_CLASSES: Record<0 | 1 | 2 | 3 | 4, string> = {
  0: "bg-muted/40",
  1: "bg-primary/20",
  2: "bg-primary/45",
  3: "bg-primary/70",
  4: "bg-primary",
};

export function SpendHeatmap() {
  const currentYear = new Date().getUTCFullYear();
  const [year, setYear] = useState(currentYear);
  const [days, setDays] = useState<DayData[]>([]);
  const [loading, setLoading] = useState(true);
  const [tooltip, setTooltip] = useState<{ date: string; amount: number; x: number; y: number } | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/expenses/heatmap?year=${year}`)
      .then((r) => r.json())
      .then((data) => {
        setDays(Array.isArray(data.days) ? data.days : []);
      })
      .catch(() => setDays([]))
      .finally(() => setLoading(false));
  }, [year]);

  // Build a lookup map date -> amount
  const dayMap = useMemo(() => {
    const m = new Map<string, number>();
    for (const d of days) m.set(d.date, d.amount);
    return m;
  }, [days]);

  const maxAmount = useMemo(() => Math.max(0, ...days.map((d) => d.amount)), [days]);
  const totalSpend = useMemo(() => days.reduce((s, d) => s + d.amount, 0), [days]);
  const activeDays = useMemo(() => days.filter((d) => d.amount > 0).length, [days]);

  // Build grid: columns = weeks, rows = day-of-week (0=Sun..6=Sat)
  const grid = useMemo(() => {
    // Start from Jan 1 of the year (UTC)
    const startDate = new Date(Date.UTC(year, 0, 1));
    const endDate = new Date(Date.UTC(year, 11, 31));

    // Pad to Sunday of first week
    const startDow = startDate.getUTCDay(); // 0=Sun
    const cells: { date: string | null; amount: number }[] = [];

    // Leading empty cells
    for (let i = 0; i < startDow; i++) cells.push({ date: null, amount: 0 });

    const d = new Date(startDate);
    while (d <= endDate) {
      const ds = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
      cells.push({ date: ds, amount: dayMap.get(ds) ?? 0 });
      d.setUTCDate(d.getUTCDate() + 1);
    }

    // Chunk into weeks
    const weeks: typeof cells[] = [];
    for (let i = 0; i < cells.length; i += 7) {
      weeks.push(cells.slice(i, i + 7));
    }
    return weeks;
  }, [year, dayMap]);

  // Month label positions: find first week index for each month
  const monthLabels = useMemo(() => {
    const labels: { month: string; weekIndex: number }[] = [];
    let lastMonth = -1;
    grid.forEach((week, wi) => {
      for (const cell of week) {
        if (cell.date) {
          const m = Number(cell.date.split("-")[1]) - 1;
          if (m !== lastMonth) {
            labels.push({ month: MONTHS[m] ?? "", weekIndex: wi });
            lastMonth = m;
          }
          break;
        }
      }
    });
    return labels;
  }, [grid]);

  const CELL_SIZE = 11;
  const CELL_GAP = 2;
  const CELL_STRIDE = CELL_SIZE + CELL_GAP;

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-foreground heading-display">
            Daily Spend Heatmap
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Color intensity = spend volume for that day
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Stats */}
          <span className="text-xs font-semibold text-muted-foreground hidden sm:inline">
            {activeDays} active days · {formatInr(totalSpend)} total
          </span>
          {/* Year selector */}
          <div className="flex items-center gap-1 rounded-xl border border-border bg-muted/50 p-1">
            <button
              onClick={() => setYear((y) => y - 1)}
              className="rounded-lg px-2.5 py-1 text-xs font-bold text-muted-foreground hover:bg-card hover:text-foreground transition-colors"
            >
              ‹
            </button>
            <span className="min-w-[36px] text-center text-xs font-bold text-foreground">{year}</span>
            <button
              onClick={() => setYear((y) => Math.min(currentYear, y + 1))}
              disabled={year >= currentYear}
              className="rounded-lg px-2.5 py-1 text-xs font-bold text-muted-foreground hover:bg-card hover:text-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              ›
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : (
        <div className="overflow-x-auto pb-2 relative">
          {/* Tooltip */}
          {tooltip && (
            <div
              className="pointer-events-none fixed z-50 rounded-xl bg-card border border-border shadow-xl px-3 py-2 text-xs space-y-0.5 animate-in fade-in duration-100"
              style={{ left: tooltip.x + 10, top: tooltip.y - 44 }}
            >
              <p className="font-bold text-foreground">{tooltip.date}</p>
              <p className="text-muted-foreground">{tooltip.amount > 0 ? formatInr(tooltip.amount) : "No spend"}</p>
            </div>
          )}

          <div style={{ position: "relative", paddingTop: 20, paddingLeft: 28 }}>
            {/* Day labels (Sun–Sat, only show Mon/Wed/Fri) */}
            <div className="absolute left-0 top-5" style={{ display: "flex", flexDirection: "column", gap: CELL_GAP }}>
              {DAYS.map((d, i) => (
                <div
                  key={d}
                  style={{ height: CELL_SIZE, fontSize: 9, lineHeight: `${CELL_SIZE}px` }}
                  className="text-muted-foreground font-medium"
                >
                  {i % 2 === 1 ? d.slice(0, 1) : ""}
                </div>
              ))}
            </div>

            {/* Month labels */}
            <div className="absolute top-0 left-7" style={{ display: "flex" }}>
              {monthLabels.map(({ month, weekIndex }) => (
                <div
                  key={month + weekIndex}
                  className="absolute text-[10px] font-semibold text-muted-foreground"
                  style={{ left: weekIndex * CELL_STRIDE, top: 0 }}
                >
                  {month}
                </div>
              ))}
            </div>

            {/* Grid */}
            <div style={{ display: "flex", gap: CELL_GAP }}>
              {grid.map((week, wi) => (
                <div key={wi} style={{ display: "flex", flexDirection: "column", gap: CELL_GAP }}>
                  {week.map((cell, di) => {
                    if (!cell.date) {
                      return (
                        <div
                          key={di}
                          style={{ width: CELL_SIZE, height: CELL_SIZE, borderRadius: 2 }}
                        />
                      );
                    }
                    const intensity = getIntensity(cell.amount, maxAmount);
                    return (
                      <div
                        key={cell.date}
                        title={`${cell.date}: ${cell.amount > 0 ? formatInr(cell.amount) : "No spend"}`}
                        onMouseEnter={(e) =>
                          setTooltip({ date: cell.date!, amount: cell.amount, x: e.clientX, y: e.clientY })
                        }
                        onMouseLeave={() => setTooltip(null)}
                        className={`cursor-default transition-opacity hover:opacity-80 ${INTENSITY_CLASSES[intensity]}`}
                        style={{ width: CELL_SIZE, height: CELL_SIZE, borderRadius: 2 }}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="mt-4 flex items-center gap-2 justify-end">
            <span className="text-[10px] text-muted-foreground font-medium">Less</span>
            {([0, 1, 2, 3, 4] as const).map((i) => (
              <div
                key={i}
                className={`rounded-sm ${INTENSITY_CLASSES[i]}`}
                style={{ width: CELL_SIZE, height: CELL_SIZE }}
              />
            ))}
            <span className="text-[10px] text-muted-foreground font-medium">More</span>
          </div>
        </div>
      )}
    </div>
  );
}
