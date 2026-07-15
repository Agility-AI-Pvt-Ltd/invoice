import { describe, it, expect } from 'vitest';
import { computeInvoiceTotals } from './gst';

describe('computeInvoiceTotals', () => {
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
});
