-- Tax invoice template: org bank type, invoice extras, reimbursement line metadata
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "bankAccountType" TEXT;

ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "invoiceRemarks" TEXT;
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "invoiceTerms" TEXT;
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "paymentMode" TEXT;
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "roundOff" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "reverseCharge" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "pdfTemplate" TEXT;

ALTER TABLE "InvoiceItem" ADD COLUMN IF NOT EXISTS "referenceId" TEXT;
ALTER TABLE "InvoiceItem" ADD COLUMN IF NOT EXISTS "lineDate" TIMESTAMP(3);
