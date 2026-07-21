import { Decimal } from "decimal.js";
import { amountScale } from "./money";

export interface ProcessedItem {
  description: string;
  hsnCode: string | null;
  quantity: string;
  unitPrice: number;
  taxRate: string;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  discount: number;
  total: number;
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

type LineInput = {
  description: string;
  hsnCode?: string;
  quantity: unknown;
  unitPrice: unknown;
  taxRate?: unknown;
  discount?: unknown;
  productId?: string | null;
};

export function calculateGST(
  amount: Decimal,
  taxRate: number,
  isInterState: boolean,
): { cgst: Decimal; sgst: Decimal; igst: Decimal } {
  const tr = new Decimal(taxRate);
  const totalTax = amount.times(tr).dividedBy(100);

  if (isInterState) {
    return { cgst: new Decimal(0), sgst: new Decimal(0), igst: totalTax };
  }

  const splitTax = totalTax.dividedBy(2);
  return { cgst: splitTax, sgst: splitTax, igst: new Decimal(0) };
}

export function computeInvoiceTotals(items: LineInput[], isInterState: boolean): InvoiceTotals {
  let subTotal = new Decimal(0);
  let cgstTotal = new Decimal(0);
  let sgstTotal = new Decimal(0);
  let igstTotal = new Decimal(0);
  let discountTotal = new Decimal(0);

  const processedItems: ProcessedItem[] = items.map((item) => {
    const scale = amountScale();
    const qty = new Decimal(Number(item.quantity) || 0);
    const price = new Decimal(Number(item.unitPrice) || 0).times(scale).toDecimalPlaces(0);
    const taxRate = Number(item.taxRate) || 0;
    const disc = new Decimal(Number(item.discount) || 0).times(scale).toDecimalPlaces(0);

    const itemSub = qty.times(price);
    const taxableAmount = itemSub.minus(disc);
    const taxes = calculateGST(taxableAmount, taxRate, isInterState);
    const cgstRounded = taxes.cgst.toDecimalPlaces(0);
    const sgstRounded = taxes.sgst.toDecimalPlaces(0);
    const igstRounded = taxes.igst.toDecimalPlaces(0);

    subTotal = subTotal.plus(itemSub);
    discountTotal = discountTotal.plus(disc);
    cgstTotal = cgstTotal.plus(cgstRounded);
    sgstTotal = sgstTotal.plus(sgstRounded);
    igstTotal = igstTotal.plus(igstRounded);

    const itemTotal = taxableAmount
      .plus(cgstRounded)
      .plus(sgstRounded)
      .plus(igstRounded);

    return {
      description: item.description,
      hsnCode: (item.hsnCode as string) || null,
      quantity: qty.toDecimalPlaces(4).toString(),
      unitPrice: price.toDecimalPlaces(0).toNumber(),
      taxRate: new Decimal(taxRate).toDecimalPlaces(2).toString(),
      cgstAmount: cgstRounded.toNumber(),
      sgstAmount: sgstRounded.toNumber(),
      igstAmount: igstRounded.toNumber(),
      discount: disc.toDecimalPlaces(0).toNumber(),
      total: itemTotal.toDecimalPlaces(0).toNumber(),
      productId: item.productId ?? null,
    };
  });

  const subRounded = subTotal.toDecimalPlaces(0);
  const discRounded = discountTotal.toDecimalPlaces(0);
  const grandTotal = subRounded
    .minus(discRounded)
    .plus(cgstTotal)
    .plus(sgstTotal)
    .plus(igstTotal);

  return {
    subTotal: subRounded.toNumber(),
    cgstTotal: cgstTotal.toNumber(),
    sgstTotal: sgstTotal.toNumber(),
    igstTotal: igstTotal.toNumber(),
    discountTotal: discRounded.toNumber(),
    grandTotal: grandTotal.toNumber(),
    processedItems,
  };
}
