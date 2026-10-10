import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  computeInvoiceTotals,
  deriveUnitPriceFromLineTotal,
  deriveLineInputsFromTargetTotal,
  deriveRateOnlyFromTargetTotal,
} from "./gst-compute";

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

describe('deriveUnitPriceFromLineTotal', () => {
  const prev = process.env.NEXT_PUBLIC_AMOUNTS_IN_PAISE;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_AMOUNTS_IN_PAISE = 'false';
  });

  afterEach(() => {
    if (prev === undefined) delete process.env.NEXT_PUBLIC_AMOUNTS_IN_PAISE;
    else process.env.NEXT_PUBLIC_AMOUNTS_IN_PAISE = prev;
  });

  it('back-calculates rate from negotiated total (intra-state)', () => {
    const rate = deriveUnitPriceFromLineTotal(14000, 1, 18, 0, false);
    const result = computeInvoiceTotals(
      [{ description: 'P', quantity: 1, unitPrice: rate, taxRate: 18, discount: 0 }],
      false,
    );
    expect(result.grandTotal).toBe(14000);
  });

  it('round-trips the 12712 → 15000 example', () => {
    const forward = computeInvoiceTotals(
      [{ description: 'P', quantity: 1, unitPrice: 12712, taxRate: 18, discount: 0 }],
      false,
    );
    expect(forward.grandTotal).toBe(15000);

    const rate = deriveUnitPriceFromLineTotal(15000, 1, 18, 0, false);
    const roundTrip = computeInvoiceTotals(
      [{ description: 'P', quantity: 1, unitPrice: rate, taxRate: 18, discount: 0 }],
      false,
    );
    expect(roundTrip.grandTotal).toBe(15000);
    expect(rate).toBeGreaterThanOrEqual(12711);
    expect(rate).toBeLessThanOrEqual(12712);
  });

  it('rate-only: lowering total adjusts rate, not discount', () => {
    let rateFor391 = 0;
    for (let rate = 30000; rate <= 32000; rate++) {
      const r = computeInvoiceTotals(
        [{ description: 'P', quantity: 1, unitPrice: rate, taxRate: 18, discount: 0 }],
        false,
      );
      if (r.grandTotal === 36391) {
        rateFor391 = rate;
        break;
      }
    }
    expect(rateFor391).toBe(30839);

    const newRate = deriveRateOnlyFromTargetTotal(
      36390,
      1,
      18,
      0,
      false,
      36391,
    );
    const result = computeInvoiceTotals(
      [{ description: 'P', quantity: 1, unitPrice: newRate, taxRate: 18, discount: 0 }],
      false,
    );
    expect(newRate).not.toBe(rateFor391);
    expect(result.grandTotal).toBeLessThanOrEqual(36390);
    expect(result.discountTotal).toBe(0);
  });
});
