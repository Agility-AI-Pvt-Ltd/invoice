import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { computeExpenseSummary } from "@/lib/expenses/summary";
import { amountsToBreakdownRows } from "@/lib/expenses/breakdown";
import { ExpenseBreakdownList } from "../_components/ExpenseBreakdownList";
import { LedgerToolbar } from "../_components/LedgerToolbar";

export default async function ExpenseSpendingPage() {
  const user = await requireAuth();
  const organizationId = user.ownedOrgs[0]?.id;
  if (!organizationId) {
    return (
      <p className="text-sm text-muted-foreground">No organization found.</p>
    );
  }

  const summary = await computeExpenseSummary(organizationId);
  const breakdownRows = amountsToBreakdownRows(summary.expenseBreakdown);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Outgoing costs this UTC month. Attachments can be noted in the description until
          receipt storage is wired.
        </p>
        <LedgerToolbar
          defaultKind="EXPENSE"
          buttonLabel="Log expense"
          variant="secondary"
        />
      </div>

      <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-bold tracking-tight text-foreground heading-display">
          Spend mix — this month (UTC)
        </h2>
        <div className="mt-6">
          {breakdownRows.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No expenses yet.{" "}
              <Link
                href="/dashboard/expenses"
                className="font-semibold text-primary underline-offset-2 hover:underline"
              >
                Overview
              </Link>{" "}
              has the same ledger.
            </p>
          ) : (
            <ExpenseBreakdownList rows={breakdownRows} />
          )}
        </div>
      </section>
    </div>
  );
}
