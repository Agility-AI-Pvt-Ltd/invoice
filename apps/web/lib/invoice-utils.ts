export type RecurringInterval = 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';

export function generateNextInvoiceNumber(lastNumber: string | null): string {
  if (!lastNumber) return 'INV-001';
  const match = lastNumber.match(/(\d+)$/);
  if (!match?.[1]) return "INV-001";
  const next = parseInt(match[1], 10) + 1;
  const prefix = lastNumber.replace(/\d+$/, "");
  return `${prefix}${String(next).padStart(3, '0')}`;
}

export function advanceDate(date: Date, interval: RecurringInterval): Date {
  const next = new Date(date);
  switch (interval) {
    case 'WEEKLY':
      next.setDate(next.getDate() + 7);
      break;
    case 'MONTHLY':
      next.setMonth(next.getMonth() + 1);
      break;
    case 'QUARTERLY':
      next.setMonth(next.getMonth() + 3);
      break;
    case 'YEARLY':
      next.setFullYear(next.getFullYear() + 1);
      break;
  }
  return next;
}
