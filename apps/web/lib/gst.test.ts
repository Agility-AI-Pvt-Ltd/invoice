import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { computeInvoiceTotals } from "./gst-compute";

describe('computeInvoiceTotals', () => {
  const prev = process.env.NEXT_PUBLIC_AMOUNTS_IN_PAISE;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_AMOUNTS_IN_PAISE = 'true';
  });

  afterEach(() => {
    if (prev === undefined) delete process.env.NEXT_PUBLIC_AMOUNTS_IN_PAISE;
    else process.env.NEXT_PUBLIC_AMOUNTS_IN_PAISE = prev;
  });

  it('calculates totals correctly for intra-state', () => {
    const items = [
      {
        description: 'Product 1',
        quantity: 2,
        unitPrice: 500,
        taxRate: 18,
        discount: 100,
      }
    ];
    
    // Inputs are rupees; storage is paise (×100).
    // Taxable = (2 * 50000) - 10000 = 90000
    // CGST = 8100, SGST = 8100, Total = 106200
    
    const result = computeInvoiceTotals(items, false);
    
    expect(result.subTotal).toBe(100000);
    expect(result.discountTotal).toBe(10000);
    expect(result.cgstTotal).toBe(8100);
    expect(result.sgstTotal).toBe(8100);
    expect(result.igstTotal).toBe(0);
    expect(result.grandTotal).toBe(106200);
  });

  it('calculates totals correctly for inter-state', () => {
    const items = [
      {
        description: 'Product 1',
        quantity: 1,
        unitPrice: 1000,
        taxRate: 12,
        discount: 0,
      }
    ];
    
    const result = computeInvoiceTotals(items, true);
    
    expect(result.subTotal).toBe(100000);
    expect(result.igstTotal).toBe(12000);
    expect(result.grandTotal).toBe(112000);
  });

  it('stores rupees when AMOUNTS_IN_PAISE is off (live DB)', () => {
    process.env.NEXT_PUBLIC_AMOUNTS_IN_PAISE = 'false';
    const result = computeInvoiceTotals(
      [{ description: 'P', quantity: 1, unitPrice: 2950, taxRate: 0, discount: 0 }],
      false,
    );
    expect(result.subTotal).toBe(2950);
    expect(result.grandTotal).toBe(2950);
  });

  it('keeps grand total aligned with rounded tax lines (rupee mode)', () => {
    process.env.NEXT_PUBLIC_AMOUNTS_IN_PAISE = 'false';
    const result = computeInvoiceTotals(
      [{ description: 'P', quantity: 1, unitPrice: 8474, taxRate: 18, discount: 0 }],
      false,
    );

    expect(result.cgstTotal).toBe(763);
    expect(result.sgstTotal).toBe(763);
    expect(result.grandTotal).toBe(10000);
    expect(result.grandTotal).toBe(
      result.subTotal - result.discountTotal + result.cgstTotal + result.sgstTotal + result.igstTotal,
    );
  });
});
