import { requireAuth } from "@/lib/auth";
import { computeExpenseBudgetRows } from "@/lib/expenses/summary";
import { BudgetClient } from "./BudgetClient";

export default async function BudgetManagementPage() {
  const user = await requireAuth();
  const organizationId = user.ownedOrgs[0]?.id;
  if (!organizationId) {
    return (
      <p className="text-sm text-muted-foreground">No organization found.</p>
    );
  }

  const rows = await computeExpenseBudgetRows(organizationId);

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Set limits per expense category and compare with actual ledger spend for the
        current UTC month.
      </p>
      <BudgetClient initialRows={rows} />
    </div>
  );
}
