import { Check, X } from "lucide-react";

const QUEUE = [
  {
    id: "APR-204",
    title: "Vendor payout — CloudMetal LLP",
    amount: 420000,
    stage: "Finance controller",
    sla: "Due today",
  },
  {
    id: "APR-198",
    title: "Quarterly bonus accrual",
    amount: 180000,
    stage: "CEO sign-off",
    sla: "Due in 2 days",
  },
];

export default function ApprovalsWorkflowPage() {
  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Multi-level approvals for large expenses. Rules engine sets thresholds by
        department and jurisdiction.
      </p>

      <div className="space-y-4">
        {QUEUE.map((item) => (
          <article
            key={item.id}
            className="rounded-2xl border border-border bg-card p-6 shadow-sm"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                  {item.id}
                </p>
                <h2 className="mt-1 text-xl font-bold text-foreground heading-display">
                  {item.title}
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Pending · <strong className="text-foreground">{item.stage}</strong> ·{" "}
                  {item.sla}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-2xl font-bold tabular-nums text-foreground">
                  ₹{item.amount.toLocaleString("en-IN")}
                </span>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600"
                >
                  <Check className="h-4 w-4" aria-hidden />
                  Approve
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-xs font-bold text-foreground hover:bg-muted/60"
                >
                  <X className="h-4 w-4" aria-hidden />
                  Reject
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
