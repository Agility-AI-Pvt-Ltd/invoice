import { requireAuth } from "@/lib/auth";
import { computeExpenseSummary } from "@/lib/expenses/summary";
import { ExpenseOverviewClient } from "./_components/ExpenseOverviewClient";

export default async function BusinessExpensesOverviewPage() {
  const user = await requireAuth();
  const organizationId = user.ownedOrgs[0]?.id;
  if (!organizationId) {
    return (
      <p className="text-sm text-muted-foreground">
        No organization found for your account.
      </p>
    );
  }

  const summary = await computeExpenseSummary(organizationId);
  return <ExpenseOverviewClient summary={summary} />;
}
