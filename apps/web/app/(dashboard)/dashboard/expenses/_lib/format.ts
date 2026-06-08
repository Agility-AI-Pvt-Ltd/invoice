export function formatInr(amountInCents: number): string {
  return `₹${(amountInCents / 100).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatInrSigned(amount: number): string {
  const sign = amount >= 0 ? "+" : "";
  return `${sign}${formatInr(amount)}`;
}
