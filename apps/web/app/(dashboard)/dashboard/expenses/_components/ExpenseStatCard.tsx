import type { LucideIcon } from "lucide-react";

export function ExpenseStatCard({
  icon: Icon,
  label,
  value,
  hint,
  trend,
  trendUp,
  className,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  hint?: string;
  trend?: string;
  trendUp?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md ${className ?? ""}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
          <Icon className="h-5 w-5" aria-hidden />
        </div>
      </div>
      <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold tracking-tight text-foreground heading-display">
        {value}
      </p>
      {trend ? (
        <p
          className={`mt-2 text-xs font-semibold ${
            trendUp === false
              ? "text-orange-600 dark:text-orange-400"
              : "text-green-600 dark:text-green-400"
          }`}
        >
          {trend}
        </p>
      ) : hint ? (
        <p className="mt-2 text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}
