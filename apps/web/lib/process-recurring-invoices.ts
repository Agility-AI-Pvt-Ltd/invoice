import { prisma } from "@repo/db";
import { advanceDate, generateNextInvoiceNumber } from "./invoice-utils";

export type ProcessRecurringItemResult =
  | { recurringId: string; invoiceId: string; status: "success" }
  | { recurringId: string; status: "error"; error: string };

/**
 * Finds due recurring invoices, generates draft invoices, advances nextIssueDate.
 * Safe to run from HTTP (with CRON_SECRET) or from a host cron via the CLI script.
 */
export async function processRecurringInvoices(): Promise<{
  processed: number;
  results: ProcessRecurringItemResult[];
}> {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const recurringInvoices = await prisma.recurringInvoice.findMany({
    where: {
      active: true,
      nextIssueDate: { lte: now },
    },
    include: {
      items: true,
      customer: true,
      organization: true,
    },
  });

  const results: ProcessRecurringItemResult[] = [];

  for (const recurring of recurringInvoices) {
    try {
      const result = await prisma.$transaction(async (tx) => {
        const lastInvoice = await tx.invoice.findFirst({
          where: { organizationId: recurring.organizationId },
          orderBy: { createdAt: "desc" },
        });

        const invoiceNumber = generateNextInvoiceNumber(lastInvoice?.invoiceNumber ?? null);
        const issueDate = new Date();
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + recurring.dueDays);

        const processedItems = recurring.items.map((item) => ({
          description: item.description,
          hsnCode: item.hsnCode,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          taxRate: item.taxRate,
          cgstAmount: item.cgstAmount,
          sgstAmount: item.sgstAmount,
          igstAmount: item.igstAmount,
          total: item.total,
        }));

        const invoice = await tx.invoice.create({
          data: {
            organizationId: recurring.organizationId,
            customerId: recurring.customerId,
            invoiceNumber,
            issueDate,
            dueDate,
            placeOfSupply: recurring.customer.stateCode,
            status: "DRAFT",
            subTotal: recurring.subTotal,
            cgstTotal: recurring.cgstTotal,
            sgstTotal: recurring.sgstTotal,
            igstTotal: recurring.igstTotal,
            total: recurring.total,
            recurringInvoiceId: recurring.id,
            items: { create: processedItems },
          },
        });

        const nextIssueDate = advanceDate(recurring.nextIssueDate, recurring.interval);
        const shouldDeactivate = recurring.endDate && nextIssueDate > recurring.endDate;

        await tx.recurringInvoice.update({
          where: { id: recurring.id },
          data: {
            nextIssueDate,
            active: !shouldDeactivate,
          },
        });

        return invoice;
      });

      await prisma.activityLog
        .create({
          data: {
            organizationId: recurring.organizationId,
            entity: "Invoice",
            entityId: result.id,
            action: "CREATED_FROM_RECURRING",
            meta: { recurringId: recurring.id, invoiceNumber: result.invoiceNumber },
          },
        })
        .catch(() => {});

      results.push({
        recurringId: recurring.id,
        invoiceId: result.id,
        status: "success",
      });
    } catch (err: unknown) {
      console.error(`Failed to process recurring invoice ${recurring.id}:`, err);
      results.push({
        recurringId: recurring.id,
        status: "error",
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return { processed: results.length, results };
}
