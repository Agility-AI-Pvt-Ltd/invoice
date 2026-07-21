import { prisma } from "@repo/db";
import type { ExpenseLedgerKind } from "@repo/db";
import { toRupees } from "@/lib/money";

/** Expense ledger is always paise; normalize invoice totals into the same unit. */
function invoiceTotalAsPaise(total: number | string | null | undefined): number {
  return Math.round(toRupees(total) * 100);
}

export type ExpenseDashboardSummary = {
  chartMonths: {
    monthKey: string;
    label: string;
    income: number;
    expenses: number;
  }[];
  currentMonth: {
    year: number;
    month: number;
    income: number;
    expenses: number;
    net: number;
  };
  previousMonth: {
    income: number;
    expenses: number;
    net: number;
  };
  trends: {
    incomePct: number | null;
    expensePct: number | null;
    netPct: number | null;
  };
  expenseBreakdown: { category: string; amount: number }[];
  incomeByCategory: { category: string; amount: number }[];
  recent: {
    id: string;
    kind: ExpenseLedgerKind;
    category: string;
    description: string | null;
    amount: number;
    occurredAt: string;
    isPayment?: boolean;
  }[];
  burnPerDay: number;
  gstToPay: number;
  gstBreakdown: {
    cgst: number;
    sgst: number;
    igst: number;
  };
};

function utcMonthBounds(year: number, month: number): { start: Date; end: Date } {
  const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
  const end = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
  return { start, end };
}

function shiftUtcMonth(year: number, month: number, delta: number): { year: number; month: number } {
  const d = new Date(Date.UTC(year, month - 1 + delta, 1));
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1 };
}

function daysInUtcMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function monthKeyFromDate(d: Date): string {
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth() + 1;
  return `${y}-${String(m).padStart(2, "0")}`;
}

function pctChange(curr: number, prev: number): number | null {
  if (prev === 0) return null;
  return Math.round(((curr - prev) / prev) * 1000) / 10;
}

export async function computeExpenseSummary(
  organizationId: string,
): Promise<ExpenseDashboardSummary> {
  const now = new Date();
  const cy = now.getUTCFullYear();
  const cm = now.getUTCMonth() + 1;

  const sixMonths: { year: number; month: number; label: string }[] = [];
  for (let i = 5; i >= 0; i--) {
    const { year, month } = shiftUtcMonth(cy, cm, -i);
    const label = new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString(
      "en-IN",
      { month: "short", timeZone: "UTC" },
    );
    sixMonths.push({ year, month, label });
  }

  const oldestMonth = sixMonths[0];
  if (!oldestMonth) {
    throw new Error("computeExpenseSummary: empty month range");
  }

  const rangeStart = utcMonthBounds(oldestMonth.year, oldestMonth.month).start;
  const rangeEnd = utcMonthBounds(cy, cm).end;

  const [ledgerRows, recentLedger, invoiceRows, recentInvoices] = await Promise.all([
    prisma.expenseLedgerEntry.findMany({
      where: {
        organizationId,
        occurredAt: { gte: rangeStart, lte: rangeEnd },
      },
      select: {
        kind: true,
        amount: true,
        occurredAt: true,
        category: true,
      },
    }),
    prisma.expenseLedgerEntry.findMany({
      where: { organizationId },
      orderBy: { occurredAt: "desc" },
      take: 15,
      select: {
        id: true,
        kind: true,
        category: true,
        description: true,
        amount: true,
        occurredAt: true,
      },
    }),
    prisma.invoice.findMany({
      where: {
        organizationId,
        issueDate: { gte: rangeStart, lte: rangeEnd },
        status: { not: "CANCELLED" },
      },
      select: {
        total: true,
        issueDate: true,
        invoiceNumber: true,
        cgstTotal: true,
        sgstTotal: true,
        igstTotal: true,
      },
    }),
    prisma.invoice.findMany({
      where: {
        organizationId,
        status: { not: "CANCELLED" },
      },
      orderBy: { issueDate: "desc" },
      take: 15,
      select: {
        id: true,
        total: true,
        issueDate: true,
        invoiceNumber: true,
        customer: {
          select: {
            name: true,
          },
        },
      },
    }),
  ]);

  const chartMap = new Map<string, { income: number; expenses: number }>();
  for (const m of sixMonths) {
    const key = `${m.year}-${String(m.month).padStart(2, "0")}`;
    chartMap.set(key, { income: 0, expenses: 0 });
  }

  const curBounds = utcMonthBounds(cy, cm);
  const prev = shiftUtcMonth(cy, cm, -1);
  const prevBounds = utcMonthBounds(prev.year, prev.month);

  let curIncome = 0;
  let curExpense = 0;
  let prevIncome = 0;
  let prevExpense = 0;

  const expenseCategoryMonth = new Map<string, number>();
  const incomeCategoryMonth = new Map<string, number>();

  for (const row of ledgerRows) {
    const amt = Number(row.amount);
    const k = monthKeyFromDate(new Date(row.occurredAt));
    const bucket = chartMap.get(k);
    if (bucket) {
      if (row.kind === "INCOME") bucket.income += amt;
      else bucket.expenses += amt;
    }

    const t = new Date(row.occurredAt).getTime();
    if (t >= curBounds.start.getTime() && t <= curBounds.end.getTime()) {
      if (row.kind === "INCOME") {
        curIncome += amt;
        incomeCategoryMonth.set(
          row.category,
          (incomeCategoryMonth.get(row.category) ?? 0) + amt,
        );
      } else {
        curExpense += amt;
        expenseCategoryMonth.set(
          row.category,
          (expenseCategoryMonth.get(row.category) ?? 0) + amt,
        );
      }
    }

    if (t >= prevBounds.start.getTime() && t <= prevBounds.end.getTime()) {
      if (row.kind === "INCOME") prevIncome += amt;
      else prevExpense += amt;
    }
  }

  let curMonthGst = 0;
  let curMonthCgst = 0;
  let curMonthSgst = 0;
  let curMonthIgst = 0;
  for (const row of invoiceRows) {
    const cgst = invoiceTotalAsPaise(row.cgstTotal);
    const sgst = invoiceTotalAsPaise(row.sgstTotal);
    const igst = invoiceTotalAsPaise(row.igstTotal);
    const gst = cgst + sgst + igst;
    const baseAmt = invoiceTotalAsPaise(row.total) - gst;
    const k = monthKeyFromDate(new Date(row.issueDate));
    const bucket = chartMap.get(k);
    if (bucket) {
      bucket.income += baseAmt;
    }

    const t = new Date(row.issueDate).getTime();
    if (t >= curBounds.start.getTime() && t <= curBounds.end.getTime()) {
      curIncome += baseAmt;
      const category = "Invoices";
      incomeCategoryMonth.set(
        category,
        (incomeCategoryMonth.get(category) ?? 0) + baseAmt,
      );
      curMonthGst += gst;
      curMonthCgst += cgst;
      curMonthSgst += sgst;
      curMonthIgst += igst;
    }

    if (t >= prevBounds.start.getTime() && t <= prevBounds.end.getTime()) {
      prevIncome += baseAmt;
    }
  }

  const chartMonths = sixMonths.map(({ year, month, label }) => {
    const key = `${year}-${String(month).padStart(2, "0")}`;
    const b = chartMap.get(key) ?? { income: 0, expenses: 0 };
    return { monthKey: key, label, income: b.income, expenses: b.expenses };
  });

  const expenseBreakdown = [...expenseCategoryMonth.entries()]
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);

  const incomeByCategory = [...incomeCategoryMonth.entries()]
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);

  const dim = daysInUtcMonth(cy, cm);
  const burnPerDay = dim > 0 ? Math.round((curExpense / dim) * 100) / 100 : 0;

  const combinedRecent = [
    ...recentLedger.map((r) => ({
      id: r.id,
      kind: r.kind,
      category: r.category,
      description: r.description,
      amount: Number(r.amount),
      occurredAt: r.occurredAt,
      isPayment: false,
    })),
    ...recentInvoices.map((inv) => ({
      id: inv.id,
      kind: "INCOME" as const,
      category: "Invoices",
      description: `Invoice #${inv.invoiceNumber} (${inv.customer.name})`,
      amount: invoiceTotalAsPaise(inv.total),
      occurredAt: inv.issueDate,
      isPayment: true,
    })),
  ]
    .sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime())
    .slice(0, 15);

  return {
    chartMonths,
    currentMonth: {
      year: cy,
      month: cm,
      income: curIncome,
      expenses: curExpense,
      net: curIncome - curExpense,
    },
    previousMonth: {
      income: prevIncome,
      expenses: prevExpense,
      net: prevIncome - prevExpense,
    },
    trends: {
      incomePct: pctChange(curIncome, prevIncome),
      expensePct: pctChange(curExpense, prevExpense),
      netPct: pctChange(curIncome - curExpense, prevIncome - prevExpense),
    },
    expenseBreakdown,
    incomeByCategory,
    recent: combinedRecent.map((r) => ({
      id: r.id,
      kind: r.kind,
      category: r.category,
      description: r.description,
      amount: r.amount,
      occurredAt: r.occurredAt.toISOString(),
      isPayment: r.isPayment,
    })),
    burnPerDay,
    gstToPay: curMonthGst,
    gstBreakdown: {
      cgst: curMonthCgst,
      sgst: curMonthSgst,
      igst: curMonthIgst,
    },
  };
}

export type BudgetRow = {
  id: string;
  category: string;
  limit: number;
  actual: number;
};

export async function computeExpenseBudgetRows(
  organizationId: string,
): Promise<BudgetRow[]> {
  const now = new Date();
  const cy = now.getUTCFullYear();
  const cm = now.getUTCMonth() + 1;
  const { start, end } = utcMonthBounds(cy, cm);

  const [budgets, grouped] = await Promise.all([
    prisma.expenseBudget.findMany({
      where: { organizationId },
      orderBy: { category: "asc" },
    }),
    prisma.expenseLedgerEntry.groupBy({
      by: ["category"],
      where: {
        organizationId,
        kind: "EXPENSE",
        occurredAt: { gte: start, lte: end },
      },
      _sum: { amount: true },
    }),
  ]);

  const actualMap = new Map(
    grouped.map((g) => [g.category, Number(g._sum.amount ?? 0)]),
  );

  return budgets.map((b) => ({
    id: b.id,
    category: b.category,
    limit: Number(b.limitAmount),
    actual: actualMap.get(b.category) ?? 0,
  }));
}
