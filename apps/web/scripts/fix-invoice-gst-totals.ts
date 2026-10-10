/**
 * Recalculate invoice GST totals using rounded per-line tax (fixes subtotal + tax ≠ total).
 *
 * Usage (from repo root):
 *   npm run fix-invoice-totals -w web -- --dry-run
 *   npm run fix-invoice-totals -w web
 */
import { config } from "dotenv";
import { resolve } from "node:path";
import { computeInvoiceTotals } from "../lib/gst-compute";
import { toRupees } from "../lib/money";

config({ path: resolve(process.cwd(), ".env") });

type DbLineItem = {
  id: string;
  description: string;
  hsnCode: string | null;
  quantity: unknown;
  unitPrice: number;
  taxRate: unknown;
  discount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  total: number;
};

function inferIsInterState(
  taxTotals: { cgstTotal: number; igstTotal: number },
  orgStateCode: string | null | undefined,
  supplyStateCode: string | null | undefined,
): boolean {
  const hasIgst = Number(taxTotals.igstTotal) > 0;
  const hasCgst = Number(taxTotals.cgstTotal) > 0;
  if (hasIgst) return true;
  if (hasCgst) return false;

  const orgState = (orgStateCode || "").match(/\d+/)?.[0] || "";
  const supplyState = (supplyStateCode || "").match(/\d+/)?.[0] || "";
  return !!orgState && !!supplyState && orgState !== supplyState;
}

function toLineInput(items: DbLineItem[]) {
  return items.map((item) => ({
    description: item.description,
    hsnCode: item.hsnCode ?? undefined,
    quantity: Number(item.quantity),
    unitPrice: toRupees(item.unitPrice),
    taxRate: Number(item.taxRate),
    discount: toRupees(item.discount),
  }));
}

function invoiceNeedsUpdate(
  stored: {
    subTotal: number;
    cgstTotal: number;
    sgstTotal: number;
    igstTotal: number;
    discountTotal: number;
    total: number;
    items: DbLineItem[];
  },
  computed: ReturnType<typeof computeInvoiceTotals>,
): boolean {
  if (
    stored.subTotal !== computed.subTotal ||
    stored.cgstTotal !== computed.cgstTotal ||
    stored.sgstTotal !== computed.sgstTotal ||
    stored.igstTotal !== computed.igstTotal ||
    stored.discountTotal !== computed.discountTotal ||
    stored.total !== computed.grandTotal
  ) {
    return true;
  }

  return stored.items.some((item, index) => {
    const next = computed.processedItems[index];
    if (!next) return true;
    return (
      item.cgstAmount !== next.cgstAmount ||
      item.sgstAmount !== next.sgstAmount ||
      item.igstAmount !== next.igstAmount ||
      item.discount !== next.discount ||
      item.total !== next.total
    );
  });
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const { prisma } = await import("@repo/db");

  const [invoices, recurring] = await Promise.all([
    prisma.invoice.findMany({
      include: {
        items: { orderBy: { createdAt: "asc" } },
        organization: { select: { stateCode: true } },
        customer: { select: { stateCode: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.recurringInvoice.findMany({
      include: {
        items: { orderBy: { createdAt: "asc" } },
        organization: { select: { stateCode: true } },
        customer: { select: { stateCode: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const invoiceChanges: Array<{
    id: string;
    invoiceNumber: string;
    before: number;
    after: number;
  }> = [];
  const recurringChanges: Array<{ id: string; title: string | null; before: number; after: number }> =
    [];

  for (const invoice of invoices) {
    const isInterState = inferIsInterState(
      invoice,
      invoice.organization.stateCode,
      invoice.placeOfSupply || invoice.customer.stateCode,
    );
    const computed = computeInvoiceTotals(toLineInput(invoice.items), isInterState);
    if (!invoiceNeedsUpdate(invoice, computed)) continue;

    invoiceChanges.push({
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      before: invoice.total,
      after: computed.grandTotal,
    });

    if (dryRun) continue;

    await prisma.$transaction(async (tx) => {
      await tx.invoice.update({
        where: { id: invoice.id },
        data: {
          subTotal: computed.subTotal,
          cgstTotal: computed.cgstTotal,
          sgstTotal: computed.sgstTotal,
          igstTotal: computed.igstTotal,
          discountTotal: computed.discountTotal,
          total: computed.grandTotal,
        },
      });

      for (let i = 0; i < invoice.items.length; i++) {
        const item = invoice.items[i]!;
        const next = computed.processedItems[i]!;
        await tx.invoiceItem.update({
          where: { id: item.id },
          data: {
            cgstAmount: next.cgstAmount,
            sgstAmount: next.sgstAmount,
            igstAmount: next.igstAmount,
            discount: next.discount,
            total: next.total,
          },
        });
      }
    });
  }

  for (const entry of recurring) {
    const isInterState = inferIsInterState(
      entry,
      entry.organization.stateCode,
      entry.customer.stateCode,
    );
    const computed = computeInvoiceTotals(toLineInput(entry.items), isInterState);
    if (!invoiceNeedsUpdate(entry, computed)) continue;

    recurringChanges.push({
      id: entry.id,
      title: entry.title,
      before: entry.total,
      after: computed.grandTotal,
    });

    if (dryRun) continue;

    await prisma.$transaction(async (tx) => {
      await tx.recurringInvoice.update({
        where: { id: entry.id },
        data: {
          subTotal: computed.subTotal,
          cgstTotal: computed.cgstTotal,
          sgstTotal: computed.sgstTotal,
          igstTotal: computed.igstTotal,
          discountTotal: computed.discountTotal,
          total: computed.grandTotal,
        },
      });

      for (let i = 0; i < entry.items.length; i++) {
        const item = entry.items[i]!;
        const next = computed.processedItems[i]!;
        await tx.recurringInvoiceItem.update({
          where: { id: item.id },
          data: {
            cgstAmount: next.cgstAmount,
            sgstAmount: next.sgstAmount,
            igstAmount: next.igstAmount,
            discount: next.discount,
            total: next.total,
          },
        });
      }
    });
  }

  console.log(
    JSON.stringify(
      {
        dryRun,
        invoicesScanned: invoices.length,
        invoicesUpdated: invoiceChanges.length,
        recurringScanned: recurring.length,
        recurringUpdated: recurringChanges.length,
        invoiceChanges: invoiceChanges.slice(0, 20),
        recurringChanges: recurringChanges.slice(0, 20),
      },
      null,
      2,
    ),
  );

  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error(error);
  try {
    const { prisma } = await import("@repo/db");
    await prisma.$disconnect();
  } catch {
    // ignore
  }
  process.exit(1);
});
