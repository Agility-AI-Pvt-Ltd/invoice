-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "recurringInvoiceId" TEXT;

-- AlterTable
ALTER TABLE "RecurringInvoice" ADD COLUMN     "autoSend" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "dueDays" INTEGER NOT NULL DEFAULT 30;

-- CreateIndex
CREATE INDEX "Invoice_recurringInvoiceId_idx" ON "Invoice"("recurringInvoiceId");

-- CreateIndex
CREATE INDEX "RecurringInvoice_organizationId_active_nextIssueDate_idx" ON "RecurringInvoice"("organizationId", "active", "nextIssueDate");

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_recurringInvoiceId_fkey" FOREIGN KEY ("recurringInvoiceId") REFERENCES "RecurringInvoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;
