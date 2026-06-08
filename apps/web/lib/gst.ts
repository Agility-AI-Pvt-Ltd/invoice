import { Decimal } from 'decimal.js';
import { invoiceItemSchema } from "@repo/domain";

export interface GSTResult {
  cgst: number;
  sgst: number;
  igst: number;
}

export interface ProcessedItem {
  description: string;
  hsnCode: string | null;
  quantity: string;
  unitPrice: string;
  taxRate: string;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  discount: number;
  total: number;
  /** Optional catalog link; validated server-side against the organization. */
  productId?: string | null;
}

export interface InvoiceTotals {
  subTotal: number;
  cgstTotal: number;
  sgstTotal: number;
  igstTotal: number;
  discountTotal: number;
  grandTotal: number;
  processedItems: ProcessedItem[];
}

/**
 * Calculates GST components with high precision.
 */
export function calculateGST(amount: Decimal, taxRate: number, isInterState: boolean): { cgst: Decimal; sgst: Decimal; igst: Decimal } {
  const tr = new Decimal(taxRate);
  const totalTax = amount.times(tr).dividedBy(100);

  if (isInterState) {
    return { cgst: new Decimal(0), sgst: new Decimal(0), igst: totalTax };
  }
  
  const splitTax = totalTax.dividedBy(2);
  return { cgst: splitTax, sgst: splitTax, igst: new Decimal(0) };
}

type LineInput = {
  description: string;
  hsnCode?: string;
  quantity: unknown;
  unitPrice: unknown;
  taxRate?: unknown;
  discount?: unknown;
  productId?: string | null;
};

/**
 * Computes all invoice totals using Decimal.js for financial accuracy.
 * Handles item-level discounts and multi-state tax logic.
 */
export function computeInvoiceTotals(items: LineInput[], isInterState: boolean): InvoiceTotals {
  let subTotal = new Decimal(0);
  let cgstTotal = new Decimal(0);
  let sgstTotal = new Decimal(0);
  let igstTotal = new Decimal(0);
  let discountTotal = new Decimal(0);

  const processedItems: ProcessedItem[] = items.map((item) => {
    const qty = new Decimal(Number(item.quantity) || 0);
    const price = new Decimal(Number(item.unitPrice) || 0).times(100).toDecimalPlaces(0);
    const taxRate = Number(item.taxRate) || 0;
    const disc = new Decimal(Number(item.discount) || 0).times(100).toDecimalPlaces(0);
    
    const itemSub = qty.times(price);
    const taxableAmount = itemSub.minus(disc);
    const taxes = calculateGST(taxableAmount, taxRate, isInterState);

    subTotal = subTotal.plus(itemSub);
    discountTotal = discountTotal.plus(disc);
    cgstTotal = cgstTotal.plus(taxes.cgst);
    sgstTotal = sgstTotal.plus(taxes.sgst);
    igstTotal = igstTotal.plus(taxes.igst);

    const itemTotal = taxableAmount.plus(taxes.cgst).plus(taxes.sgst).plus(taxes.igst);

    return {
      description: item.description,
      hsnCode: (item.hsnCode as string) || null,
      quantity: qty.toDecimalPlaces(4).toString(),
      unitPrice: price.toDecimalPlaces(0).toNumber(),
      taxRate: new Decimal(taxRate).toDecimalPlaces(2).toString(),
      cgstAmount: taxes.cgst.toDecimalPlaces(0).toNumber(),
      sgstAmount: taxes.sgst.toDecimalPlaces(0).toNumber(),
      igstAmount: taxes.igst.toDecimalPlaces(0).toNumber(),
      discount: disc.toDecimalPlaces(0).toNumber(),
      total: itemTotal.toDecimalPlaces(0).toNumber(),
      productId: item.productId ?? null,
    };
  });

  const grandTotal = subTotal.minus(discountTotal).plus(cgstTotal).plus(sgstTotal).plus(igstTotal);

  return {
    subTotal: subTotal.toDecimalPlaces(0).toNumber(),
    cgstTotal: cgstTotal.toDecimalPlaces(0).toNumber(),
    sgstTotal: sgstTotal.toDecimalPlaces(0).toNumber(),
    igstTotal: igstTotal.toDecimalPlaces(0).toNumber(),
    discountTotal: discountTotal.toDecimalPlaces(0).toNumber(),
    grandTotal: grandTotal.toDecimalPlaces(0).toNumber(),
    processedItems,
  };
}

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
