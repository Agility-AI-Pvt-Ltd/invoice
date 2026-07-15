/**
 * Money unit helpers.
 *
 * Live DB historically stores invoice/product amounts in whole rupees.
 * Newer/local DBs store integer paise (rupees × 100).
 *
 * Set NEXT_PUBLIC_AMOUNTS_IN_PAISE=true when the DB stores paise.
 * Leave unset/false for live (rupees) so ₹2950 is not shown as ₹29.5.
 */
export function amountScale(): number {
  const flag =
    process.env.NEXT_PUBLIC_AMOUNTS_IN_PAISE ?? process.env.AMOUNTS_IN_PAISE;
  return flag === "true" || flag === "1" ? 100 : 1;
}

export function amountsArePaise(): boolean {
  return amountScale() === 100;
}

/** Convert a DB-stored amount to rupees for UI / PDF / email. */
export function toRupees(amount: number | string | null | undefined): number {
  const n = Number(amount);
  if (!Number.isFinite(n)) return 0;
  return n / amountScale();
}

/** Convert a rupee amount from the form into DB storage units. */
export function toStoredAmount(rupees: number | string | null | undefined): number {
  const n = Number(rupees);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * amountScale());
}

export function formatInr(
  amount: number | string | null | undefined,
  opts?: { minimumFractionDigits?: number; maximumFractionDigits?: number },
): string {
  const {
    minimumFractionDigits = 0,
    maximumFractionDigits = 2,
  } = opts ?? {};
  return `₹${toRupees(amount).toLocaleString("en-IN", {
    minimumFractionDigits,
    maximumFractionDigits,
  })}`;
}
