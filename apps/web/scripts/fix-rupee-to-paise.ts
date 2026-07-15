/**
 * One-time fix: invoices created before integer-subunit (paise) storage
 * (commit ec4c122, 2026-06-08) were saved in rupees. UI now divides by 100,
 * so ₹2950 showed as ₹29.5.
 *
 * Usage (from repo root):
 *   npx tsx apps/web/scripts/fix-rupee-to-paise.ts --dry-run
 *   npx tsx apps/web/scripts/fix-rupee-to-paise.ts
 *
 * Requires DATABASE_URL. Safe to re-run only if cutoff still matches — do not
 * run twice on the same rows after a successful apply.
 */
import "dotenv/config";
import { prisma } from "@repo/db";

/** Matches when gst.ts started multiplying unitPrice/discount by 100. */
const CUTOFF = new Date("2026-06-08T00:00:00.000+05:30");

async function main() {
  const dryRun = process.argv.includes("--dry-run");

  const invoices = await prisma.invoice.findMany({
    where: { createdAt: { lt: CUTOFF } },
    select: { id: true, invoiceNumber: true, total: true },
  });
  const items = await prisma.invoiceItem.findMany({
    where: { invoice: { createdAt: { lt: CUTOFF } } },
    select: { id: true },
  });
  const payments = await prisma.payment.findMany({
    where: { invoice: { createdAt: { lt: CUTOFF } } },
    select: { id: true },
  });
  const recurring = await prisma.recurringInvoice.findMany({
    where: { createdAt: { lt: CUTOFF } },
    select: { id: true },
  });
  const recurringItems = await prisma.recurringInvoiceItem.findMany({
    where: { recurringInvoice: { createdAt: { lt: CUTOFF } } },
    select: { id: true },
  });

  console.log(
    JSON.stringify(
      {
        dryRun,
        cutoff: CUTOFF.toISOString(),
        counts: {
          invoices: invoices.length,
          invoiceItems: items.length,
          payments: payments.length,
          recurringInvoices: recurring.length,
          recurringItems: recurringItems.length,
        },
        sample: invoices.slice(0, 5).map((i) => ({
          invoiceNumber: i.invoiceNumber,
          totalBefore: i.total,
          totalAfter: i.total * 100,
        })),
      },
      null,
      2,
    ),
  );

  if (dryRun) {
    await prisma.$disconnect();
    return;
  }

  if (invoices.length === 0 && recurring.length === 0) {
    console.log("Nothing to migrate.");
    await prisma.$disconnect();
    return;
  }

  await prisma.$transaction(async (tx) => {
    for (const inv of invoices) {
      await tx.invoice.update({
        where: { id: inv.id },
        data: {
          subTotal: { multiply: 100 },
          cgstTotal: { multiply: 100 },
          sgstTotal: { multiply: 100 },
          igstTotal: { multiply: 100 },
          discountTotal: { multiply: 100 },
          total: { multiply: 100 },
        },
      });
    }

    for (const item of items) {
      await tx.invoiceItem.update({
        where: { id: item.id },
        data: {
          unitPrice: { multiply: 100 },
          cgstAmount: { multiply: 100 },
          sgstAmount: { multiply: 100 },
          igstAmount: { multiply: 100 },
          discount: { multiply: 100 },
          total: { multiply: 100 },
        },
      });
    }

    for (const p of payments) {
      await tx.payment.update({
        where: { id: p.id },
        data: { amount: { multiply: 100 } },
      });
    }

    for (const r of recurring) {
      await tx.recurringInvoice.update({
        where: { id: r.id },
        data: {
          subTotal: { multiply: 100 },
          cgstTotal: { multiply: 100 },
          sgstTotal: { multiply: 100 },
          igstTotal: { multiply: 100 },
          discountTotal: { multiply: 100 },
          total: { multiply: 100 },
        },
      });
    }

    for (const ri of recurringItems) {
      await tx.recurringInvoiceItem.update({
        where: { id: ri.id },
        data: {
          unitPrice: { multiply: 100 },
          cgstAmount: { multiply: 100 },
          sgstAmount: { multiply: 100 },
          igstAmount: { multiply: 100 },
          discount: { multiply: 100 },
          total: { multiply: 100 },
        },
      });
    }
  });

  console.log("Migration applied.");
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect().catch(() => {});
  process.exit(1);
});
