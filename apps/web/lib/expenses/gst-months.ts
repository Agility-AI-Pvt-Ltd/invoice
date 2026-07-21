import type { ExpenseDashboardSummary } from "./summary";

export type GstBreakdownLabels = {
  cgst: string;
  sgst: string;
  igst: string;
};

export type GstMonthOption = {
  monthKey: string;
  label: string;
  totalFormatted: string;
  breakdownFormatted: GstBreakdownLabels;
  isCurrent?: boolean;
};

export function buildGstMonthOptions(
  gstByMonth: ExpenseDashboardSummary["gstByMonth"],
  formatAmount: (amount: number) => string,
  currentMonthKey: string,
): GstMonthOption[] {
  return gstByMonth.map((month) => ({
    monthKey: month.monthKey,
    label: month.label,
    totalFormatted: formatAmount(month.total),
    breakdownFormatted: {
      cgst: formatAmount(month.breakdown.cgst),
      sgst: formatAmount(month.breakdown.sgst),
      igst: formatAmount(month.breakdown.igst),
    },
    isCurrent: month.monthKey === currentMonthKey,
  }));
}

export function currentUtcMonthKey(): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth() + 1;
  return `${year}-${String(month).padStart(2, "0")}`;
}
