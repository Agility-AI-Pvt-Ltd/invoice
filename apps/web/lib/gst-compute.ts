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

/** Back-calculate unit price (₹) from a negotiated tax-inclusive line total. */
export function deriveUnitPriceFromLineTotal(
  targetTotalRupees: number,
  quantity: number,
  taxRate: number,
  discountRupees: number,
  isInterState: boolean,
): number {
  const qty = Number(quantity) || 1;
  const disc = Number(discountRupees) || 0;
  const rate = Number(taxRate) || 0;
  if (targetTotalRupees <= 0 || qty <= 0) return 0;

  const scale = amountScale();
  const targetStored = Math.round(targetTotalRupees * scale);

  const lineTotalForPrice = (unitPriceRupees: number) => {
    const result = computeInvoiceTotals(
      [
        {
          description: "",
          quantity: qty,
          unitPrice: unitPriceRupees,
          taxRate: rate,
          discount: disc,
        },
      ],
      isInterState,
    );
    return result.processedItems[0]?.total ?? 0;
  };

  const taxableEstimate = targetTotalRupees / (1 + rate / 100);
  let low = 0;
  let high = Math.max((taxableEstimate + disc) / qty * 2, 1);
  let best = (taxableEstimate + disc) / qty;

  for (let i = 0; i < 64; i++) {
    const mid = (low + high) / 2;
    const computed = lineTotalForPrice(mid);

    if (Math.abs(computed - targetStored) <= scale / 2) {
      return pickBestUnitPrice(mid, lineTotalForPrice, targetStored, scale);
    }

    if (computed < targetStored) {
      low = mid;
      best = mid;
    } else {
      high = mid;
    }
  }

  return pickBestUnitPrice(best, lineTotalForPrice, targetStored, scale);
}

function pickBestUnitPrice(
  estimate: number,
  lineTotalForPrice: (price: number) => number,
  targetStored: number,
  scale: number,
): number {
  const candidates = new Set<number>();
  const base = Math.round(estimate * 100) / 100;
  for (let delta = -0.05; delta <= 0.05; delta += 0.01) {
    candidates.add(Number((base + delta).toFixed(2)));
  }
  candidates.add(Number(estimate.toFixed(2)));

  let bestPrice = base;
  let bestDiff = Infinity;

  for (const price of candidates) {
    if (price < 0) continue;
    const diff = Math.abs(lineTotalForPrice(price) - targetStored);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestPrice = price;
    }
    if (diff <= scale / 2) return price;
  }

  return bestPrice;
}

export type LineInputsFromTotal = {
  unitPrice: number;
  discount: number;
};

function lineTotalStored(
  quantity: number,
  unitPriceRupees: number,
  taxRate: number,
  discountRupees: number,
  isInterState: boolean,
): number {
  const result = computeInvoiceTotals(
    [
      {
        description: "",
        quantity,
        unitPrice: unitPriceRupees,
        taxRate,
        discount: discountRupees,
      },
    ],
    isInterState,
  );
  return result.processedItems[0]?.total ?? 0;
}

function tryDiscountForTargetTotal(
  unitPriceRupees: number,
  quantity: number,
  taxRate: number,
  isInterState: boolean,
  targetStored: number,
  mode: "exact" | "atMost" | "atLeast" = "exact",
): LineInputsFromTotal | null {
  const qty = Number(quantity) || 1;
  const maxDisc = unitPriceRupees * qty;
  const scale = amountScale();

  const totalAt = (discountRupees: number) =>
    lineTotalStored(qty, unitPriceRupees, taxRate, discountRupees, isInterState);

  if (mode === "exact") {
    let low = 0;
    let high = maxDisc;
    let bestDiscount = 0;
    let bestDiff = Infinity;

    for (let i = 0; i < 80; i++) {
      const mid = (low + high) / 2;
      const total = totalAt(mid);
      const diff = Math.abs(total - targetStored);
      if (diff < bestDiff) {
        bestDiff = diff;
        bestDiscount = mid;
      }
      if (total === targetStored) {
        return {
          unitPrice: Number(unitPriceRupees.toFixed(2)),
          discount: Number(mid.toFixed(2)),
        };
      }
      if (total > targetStored) {
        low = mid;
      } else {
        high = mid;
      }
    }

    if (bestDiff <= scale / 2) {
      return {
        unitPrice: Number(unitPriceRupees.toFixed(2)),
        discount: Number(bestDiscount.toFixed(2)),
      };
    }
    return null;
  }

  if (mode === "atMost") {
    if (totalAt(0) <= targetStored) {
      return { unitPrice: Number(unitPriceRupees.toFixed(2)), discount: 0 };
    }
    let low = 0;
    let high = maxDisc;
    for (let i = 0; i < 80; i++) {
      const mid = (low + high) / 2;
      if (totalAt(mid) > targetStored) {
        low = mid;
      } else {
        high = mid;
      }
    }
    return {
      unitPrice: Number(unitPriceRupees.toFixed(2)),
      discount: Number(high.toFixed(2)),
    };
  }

  // atLeast — raise total by lowering discount / used when negotiating up
  if (totalAt(0) >= targetStored) {
    return { unitPrice: Number(unitPriceRupees.toFixed(2)), discount: 0 };
  }
  return null;
}

/**
 * Resolve unit price + discount so the line total matches a negotiated amount.
 * Uses discount fine-tuning when GST rounding prevents an exact rate-only match.
 */
export function deriveLineInputsFromTargetTotal(
  targetTotalRupees: number,
  quantity: number,
  taxRate: number,
  isInterState: boolean,
  options?: {
    currentUnitPrice?: number;
    currentDiscount?: number;
    currentTotalRupees?: number;
  },
): LineInputsFromTotal {
  const qty = Number(quantity) || 1;
  if (targetTotalRupees <= 0 || qty <= 0) return { unitPrice: 0, discount: 0 };

  const scale = amountScale();
  const targetStored = Math.round(targetTotalRupees * scale);
  const currentUnitPrice = options?.currentUnitPrice ?? 0;
  const currentDiscount = options?.currentDiscount ?? 0;
  const currentTotalStored =
    options?.currentTotalRupees !== undefined
      ? Math.round(options.currentTotalRupees * scale)
      : currentUnitPrice > 0
        ? lineTotalStored(qty, currentUnitPrice, taxRate, currentDiscount, isInterState)
        : null;

  const discountMode: "exact" | "atMost" | "atLeast" =
    currentTotalStored === null
      ? "exact"
      : targetStored < currentTotalStored
        ? "atMost"
        : targetStored > currentTotalStored
          ? "atLeast"
          : "exact";

  // Prefer discount tweak at current list rate (works for small ₹ negotiations).
  if (currentUnitPrice > 0) {
    const viaCurrentRate = tryDiscountForTargetTotal(
      currentUnitPrice,
      qty,
      taxRate,
      isInterState,
      targetStored,
      discountMode,
    );
    if (viaCurrentRate) return viaCurrentRate;
  }

  const derivedRate = deriveUnitPriceFromLineTotal(
    targetTotalRupees,
    qty,
    taxRate,
    0,
    isInterState,
  );

  if (lineTotalStored(qty, derivedRate, taxRate, 0, isInterState) === targetStored) {
    return { unitPrice: derivedRate, discount: 0 };
  }

  const viaDerivedRate = tryDiscountForTargetTotal(
    derivedRate,
    qty,
    taxRate,
    isInterState,
    targetStored,
    discountMode,
  );
  if (viaDerivedRate) return viaDerivedRate;

  return {
    unitPrice: derivedRate,
    discount: currentDiscount,
  };
}

/** Adjust unit price only (discount unchanged) to reach a negotiated total. */
export function deriveRateOnlyFromTargetTotal(
  targetTotalRupees: number,
  quantity: number,
  taxRate: number,
  discountRupees: number,
  isInterState: boolean,
  currentTotalRupees?: number,
): number {
  const qty = Number(quantity) || 1;
  const disc = Number(discountRupees) || 0;
  if (targetTotalRupees <= 0 || qty <= 0) return 0;

  const scale = amountScale();
  const targetStored = Math.round(targetTotalRupees * scale);
  const currentStored =
    currentTotalRupees !== undefined
      ? Math.round(currentTotalRupees * scale)
      : null;

  const totalAt = (unitPrice: number) =>
    lineTotalStored(qty, unitPrice, taxRate, disc, isInterState);

  const mode: "exact" | "atMost" | "atLeast" =
    currentStored === null
      ? "exact"
      : targetStored < currentStored
        ? "atMost"
        : targetStored > currentStored
          ? "atLeast"
          : "exact";

  if (mode === "exact") {
    return deriveUnitPriceFromLineTotal(
      targetTotalRupees,
      qty,
      taxRate,
      disc,
      isInterState,
    );
  }

  const estimate =
    (targetTotalRupees / (1 + (Number(taxRate) || 0) / 100) + disc) / qty;
  let low = 0;
  let high = Math.max(estimate * 2, 1);

  if (mode === "atMost") {
    if (totalAt(0) > targetStored) return 0;
    let best = 0;
    for (let i = 0; i < 80; i++) {
      const mid = (low + high) / 2;
      const total = totalAt(mid);
      if (total <= targetStored) {
        best = mid;
        low = mid;
      } else {
        high = mid;
      }
    }
    let candidate = Number(best.toFixed(2));
    while (candidate > 0 && totalAt(candidate) > targetStored) {
      candidate = Number((candidate - 0.01).toFixed(2));
    }
    return candidate;
  }

  let best = high;
  for (let i = 0; i < 80; i++) {
    const mid = (low + high) / 2;
    const total = totalAt(mid);
    if (total >= targetStored) {
      best = mid;
      high = mid;
    } else {
      low = mid;
    }
  }
  let candidate = Number(best.toFixed(2));
  while (candidate < high * 2 && totalAt(candidate) < targetStored) {
    candidate = Number((candidate + 0.01).toFixed(2));
  }
  return candidate;
}
