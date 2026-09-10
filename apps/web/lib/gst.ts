import { invoiceItemSchema } from "@repo/domain";

export type { ProcessedItem, InvoiceTotals } from "./gst-compute";
export { calculateGST, computeInvoiceTotals } from "./gst-compute";

export function validateItems(items: unknown[]): string | null {
  if (!Array.isArray(items)) return "Items must be an array";

  for (let i = 0; i < items.length; i++) {
    const result = invoiceItemSchema.safeParse(items[i]);
    if (!result.success) {
      const error = result.error.issues[0];
      return `Item ${i + 1}: ${error?.message || "Invalid item data"}`;
    }
  }
  return null;
}
