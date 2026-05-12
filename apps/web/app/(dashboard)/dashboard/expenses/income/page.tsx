import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { computeExpenseSummary } from "@/lib/expenses/summary";
import { LedgerToolbar } from "../_components/LedgerToolbar";

export default async function IncomeTrackingPage() {
  const user = await requireAuth();
  const organizationId = user.ownedOrgs[0]?.id;
  if (!organizationId) {
    return (
      <p className="text-sm text-muted-foreground">No organization found.</p>
    );
  }

  const summary = await computeExpenseSummary(organizationId);
  const rows = summary.incomeByCategory;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Revenue grouped by category for the current UTC month. Entries are shared with the{" "}
          <Link href="/dashboard/expenses" className="font-semibold text-primary underline-offset-2 hover:underline">
            Overview
          </Link>
          .
        </p>
        <LedgerToolbar
          defaultKind="INCOME"
          buttonLabel="Log income"
          variant="primary"
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-muted/40">
            <tr>
              <th className="px-6 py-3 font-semibold text-muted-foreground">
                Category
              </th>
              <th className="px-6 py-3 text-right font-semibold text-muted-foreground">
                This month (UTC)
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={2}
                  className="px-6 py-10 text-center text-muted-foreground"
                >
                  No income logged this month yet.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.category} className="hover:bg-muted/30">
                  <td className="px-6 py-4 font-semibold text-foreground">
                    {row.category}
                  </td>
                  <td className="px-6 py-4 text-right font-bold tabular-nums text-foreground">
                    ₹{row.amount.toLocaleString("en-IN")}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground">
        Tip: pair with{" "}
        <Link
          href="/dashboard/recurring"
          className="font-semibold text-primary underline-offset-2 hover:underline"
        >
          Recurring
        </Link>{" "}
        billing for predictable subscription revenue.
      </p>
    </div>
  );
}
