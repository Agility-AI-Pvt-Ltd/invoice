import { prisma } from "@repo/db";

export type ExpenseReportPeriod = {
  period: string;
  income: number;
  expenses: number;
};

export async function computeExpenseReport(
  organizationId: string,
  granularity: "monthly" | "quarterly" | "annual",
): Promise<ExpenseReportPeriod[]> {
  const now = new Date();
  const cy = now.getUTCFullYear();
  const rangeStart = new Date(Date.UTC(cy - 3, 0, 1));

  const rows = await prisma.expenseLedgerEntry.findMany({
    where: { organizationId, occurredAt: { gte: rangeStart } },
    select: { kind: true, amount: true, occurredAt: true },
  });

  const map = new Map<string, { income: number; expenses: number }>();

  for (const row of rows) {
    const d = new Date(row.occurredAt);
    const y = d.getUTCFullYear();
    const m = d.getUTCMonth() + 1;
    let key: string;
    if (granularity === "annual") {
      key = String(y);
    } else if (granularity === "quarterly") {
      const q = Math.floor((m - 1) / 3) + 1;
      key = `${y} Q${q}`;
    } else {
      key = `${y}-${String(m).padStart(2, "0")}`;
    }
    const bucket = map.get(key) ?? { income: 0, expenses: 0 };
    const amt = Number(row.amount);
    if (row.kind === "INCOME") bucket.income += amt;
    else bucket.expenses += amt;
    map.set(key, bucket);
  }

  function sortKey(p: string): number {
    if (granularity === "annual") return Number(p) * 12;
    if (granularity === "monthly") {
      const parts = p.split("-");
      const yy = Number(parts[0]);
      const mm = Number(parts[1]);
      if (!Number.isFinite(yy) || !Number.isFinite(mm)) return 0;
      return yy * 12 + mm;
    }
    const match = /^(\d+)\s+Q(\d+)$/.exec(p);
    if (match) {
      const yy = Number(match[1]);
      const q = Number(match[2]);
      if (!Number.isFinite(yy) || !Number.isFinite(q)) return 0;
      return yy * 12 + (q - 1) * 3;
    }
    return 0;
  }

  return [...map.entries()]
    .map(([period, v]) => ({ period, income: v.income, expenses: v.expenses }))
    .sort((a, b) => sortKey(a.period) - sortKey(b.period));
}
