const ones = [
  "",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Eleven",
  "Twelve",
  "Thirteen",
  "Fourteen",
  "Fifteen",
  "Sixteen",
  "Seventeen",
  "Eighteen",
  "Nineteen",
];
const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function twoDigits(n: number): string {
  if (n < 20) return ones[n] ?? "";
  const t = Math.floor(n / 10);
  const o = n % 10;
  return `${tens[t] ?? ""}${o ? ` ${ones[o]}` : ""}`.trim();
}

function sectionToWords(n: number, label: string): string {
  if (n === 0) return "";
  return `${twoDigits(n)} ${label}`;
}

function integerToWords(n: number): string {
  if (n === 0) return "Zero";
  const parts: string[] = [];
  const crore = Math.floor(n / 1_00_00_000);
  n %= 1_00_00_000;
  const lakh = Math.floor(n / 1_00_000);
  n %= 1_00_000;
  const thousand = Math.floor(n / 1000);
  n %= 1000;
  const hundred = Math.floor(n / 100);
  const rest = n % 100;

  if (crore) parts.push(`${twoDigits(crore)} Crore`);
  if (lakh) parts.push(`${twoDigits(lakh)} Lakh`);
  if (thousand) parts.push(`${twoDigits(thousand)} Thousand`);
  if (hundred) parts.push(`${ones[hundred]} Hundred`);
  if (rest) {
    if (parts.length) parts.push("and");
    parts.push(twoDigits(rest));
  }
  return parts.join(" ");
}

/** Indian-style amount in words for invoice footers (rupees + paise). */
export function amountInWordsIndian(amountRupees: number): string {
  const abs = Math.abs(amountRupees);
  const rupees = Math.floor(abs);
  const paise = Math.round((abs - rupees) * 100);
  let words = integerToWords(rupees);
  if (paise > 0) {
    words += ` and ${integerToWords(paise)} Paise`;
  }
  return `Rupees ${words} Only`;
}
