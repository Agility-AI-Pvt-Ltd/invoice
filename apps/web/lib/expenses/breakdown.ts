export type BreakdownRow = {
  category: string;
  amount: number;
  fraction: number;
  barClass: string;
};

const BAR_CLASSES = [
  "bg-primary",
  "bg-primary/75",
  "bg-orange-500/90",
  "bg-orange-500/75",
  "bg-amber-500/85",
  "bg-amber-400/80",
];

export function amountsToBreakdownRows(
  items: { category: string; amount: number }[],
): BreakdownRow[] {
  const max = Math.max(1, ...items.map((i) => i.amount));
  return items.map((row, i) => ({
    category: row.category,
    amount: row.amount,
    fraction: row.amount / max,
    barClass: BAR_CLASSES[i % BAR_CLASSES.length] ?? "bg-primary",
  }));
}
