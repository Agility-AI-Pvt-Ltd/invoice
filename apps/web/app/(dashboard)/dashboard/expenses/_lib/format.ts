export function formatInr(amount: number): string {
  return `₹${amount.toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

export function formatInrSigned(amount: number): string {
  const sign = amount >= 0 ? "+" : "";
  return `${sign}${formatInr(amount)}`;
}
