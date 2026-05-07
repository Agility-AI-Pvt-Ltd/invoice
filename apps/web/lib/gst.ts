export interface GSTResult {
  cgst: number;
  sgst: number;
  igst: number;
}

export interface ProcessedItem {
  description: string;
  hsnCode: string | null;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  total: number;
  /** Optional catalog link; validated server-side against the organization. */
  productId?: string | null;
}

export interface InvoiceTotals {
  subTotal: number;
  cgstTotal: number;
  sgstTotal: number;
  igstTotal: number;
  grandTotal: number;
  processedItems: ProcessedItem[];
}

export function calculateGST(amount: number, taxRate: number, isInterState: boolean): GSTResult {
  const totalTax = (amount * taxRate) / 100;
  if (isInterState) return { cgst: 0, sgst: 0, igst: totalTax };
  return { cgst: totalTax / 2, sgst: totalTax / 2, igst: 0 };
}

type LineInput = {
  description: string;
  hsnCode?: string;
  quantity: unknown;
  unitPrice: unknown;
  taxRate?: unknown;
  productId?: string | null;
};

export function computeInvoiceTotals(items: LineInput[], isInterState: boolean): InvoiceTotals {
  let subTotal = 0, cgstTotal = 0, sgstTotal = 0, igstTotal = 0;

  const processedItems: ProcessedItem[] = items.map((item) => {
    const qty = Number(item.quantity) || 0;
    const price = Number(item.unitPrice) || 0;
    const taxRate = Number(item.taxRate) || 0;
    const itemSub = qty * price;
    const taxes = calculateGST(itemSub, taxRate, isInterState);

    subTotal += itemSub;
    cgstTotal += taxes.cgst;
    sgstTotal += taxes.sgst;
    igstTotal += taxes.igst;

    return {
      description: item.description,
      hsnCode: (item.hsnCode as string) || null,
      quantity: qty,
      unitPrice: price,
      taxRate,
      cgstAmount: taxes.cgst,
      sgstAmount: taxes.sgst,
      igstAmount: taxes.igst,
      total: itemSub + taxes.cgst + taxes.sgst + taxes.igst,
      productId: item.productId ?? null,
    };
  });

  return {
    subTotal,
    cgstTotal,
    sgstTotal,
    igstTotal,
    grandTotal: subTotal + cgstTotal + sgstTotal + igstTotal,
    processedItems,
  };
}

export function validateItems(items: unknown[]): string | null {
  for (let i = 0; i < items.length; i++) {
    const item = items[i] as any;
    const qty = Number(item.quantity);
    const price = Number(item.unitPrice);
    const taxRate = Number(item.taxRate ?? 0);
    if (!item.description?.trim()) return `Item ${i + 1}: description is required`;
    if (!qty || qty <= 0) return `Item ${i + 1}: quantity must be greater than 0`;
    if (price < 0) return `Item ${i + 1}: unit price cannot be negative`;
    if (taxRate < 0 || taxRate > 100) return `Item ${i + 1}: tax rate must be between 0 and 100`;
  }
  return null;
}
