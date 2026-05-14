import { formatInr } from "../_lib/format";
import type { BreakdownRow } from "@/lib/expenses/breakdown";

export type { BreakdownRow };

export function ExpenseBreakdownList({ rows }: { rows: BreakdownRow[] }) {
  return (
    <ul className="space-y-4">
      {rows.map((row) => (
        <li key={row.category}>
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="font-medium text-foreground">{row.category}</span>
            <span className="shrink-0 font-semibold tabular-nums text-foreground">
              {formatInr(row.amount)}
            </span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full rounded-full transition-all ${row.barClass}`}
              style={{ width: `${Math.min(100, row.fraction * 100)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
