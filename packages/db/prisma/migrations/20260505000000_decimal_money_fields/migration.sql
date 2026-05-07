-- Migration: Float → Decimal for all monetary fields
-- Reason: IEEE 754 double precision accumulates rounding errors for financial data.
-- NUMERIC(12,2) stores exact values up to 9,999,999,999.99 with 2 decimal places.

-- Invoice
ALTER TABLE "Invoice"
  ALTER COLUMN "subTotal"   TYPE NUMERIC(12,2) USING ROUND("subTotal"::NUMERIC, 2),
  ALTER COLUMN "cgstTotal"  TYPE NUMERIC(12,2) USING ROUND("cgstTotal"::NUMERIC, 2),
  ALTER COLUMN "sgstTotal"  TYPE NUMERIC(12,2) USING ROUND("sgstTotal"::NUMERIC, 2),
  ALTER COLUMN "igstTotal"  TYPE NUMERIC(12,2) USING ROUND("igstTotal"::NUMERIC, 2),
  ALTER COLUMN "total"      TYPE NUMERIC(12,2) USING ROUND("total"::NUMERIC, 2);

-- InvoiceItem
ALTER TABLE "InvoiceItem"
  ALTER COLUMN "taxRate"    TYPE NUMERIC(5,2)  USING ROUND("taxRate"::NUMERIC, 2),
  ALTER COLUMN "cgstAmount" TYPE NUMERIC(12,2) USING ROUND("cgstAmount"::NUMERIC, 2),
  ALTER COLUMN "sgstAmount" TYPE NUMERIC(12,2) USING ROUND("sgstAmount"::NUMERIC, 2),
  ALTER COLUMN "igstAmount" TYPE NUMERIC(12,2) USING ROUND("igstAmount"::NUMERIC, 2),
  ALTER COLUMN "total"      TYPE NUMERIC(12,2) USING ROUND("total"::NUMERIC, 2);

-- Payment
ALTER TABLE "Payment"
  ALTER COLUMN "amount"     TYPE NUMERIC(12,2) USING ROUND("amount"::NUMERIC, 2);

-- RecurringInvoice
ALTER TABLE "RecurringInvoice"
  ALTER COLUMN "subTotal"   TYPE NUMERIC(12,2) USING ROUND("subTotal"::NUMERIC, 2),
  ALTER COLUMN "cgstTotal"  TYPE NUMERIC(12,2) USING ROUND("cgstTotal"::NUMERIC, 2),
  ALTER COLUMN "sgstTotal"  TYPE NUMERIC(12,2) USING ROUND("sgstTotal"::NUMERIC, 2),
  ALTER COLUMN "igstTotal"  TYPE NUMERIC(12,2) USING ROUND("igstTotal"::NUMERIC, 2),
  ALTER COLUMN "total"      TYPE NUMERIC(12,2) USING ROUND("total"::NUMERIC, 2);

-- RecurringInvoiceItem
ALTER TABLE "RecurringInvoiceItem"
  ALTER COLUMN "taxRate"    TYPE NUMERIC(5,2)  USING ROUND("taxRate"::NUMERIC, 2),
  ALTER COLUMN "cgstAmount" TYPE NUMERIC(12,2) USING ROUND("cgstAmount"::NUMERIC, 2),
  ALTER COLUMN "sgstAmount" TYPE NUMERIC(12,2) USING ROUND("sgstAmount"::NUMERIC, 2),
  ALTER COLUMN "igstAmount" TYPE NUMERIC(12,2) USING ROUND("igstAmount"::NUMERIC, 2),
  ALTER COLUMN "total"      TYPE NUMERIC(12,2) USING ROUND("total"::NUMERIC, 2);
