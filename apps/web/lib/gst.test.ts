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
    
    // Taxable = (2 * 500) - 100 = 900
    // CGST = 900 * 0.09 = 81
    // SGST = 900 * 0.09 = 81
    // IGST = 0
    // Total = 900 + 81 + 81 = 1062
    
    const result = computeInvoiceTotals(items, false);
    
    expect(result.subTotal).toBe(1000);
    expect(result.discountTotal).toBe(100);
    expect(result.cgstTotal).toBe(81);
    expect(result.sgstTotal).toBe(81);
    expect(result.igstTotal).toBe(0);
    expect(result.grandTotal).toBe(1062);
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
    
    expect(result.subTotal).toBe(1000);
    expect(result.igstTotal).toBe(120);
    expect(result.grandTotal).toBe(1120);
  });
});
