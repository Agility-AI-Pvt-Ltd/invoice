-- CreateEnum
CREATE TYPE "ExpenseLedgerKind" AS ENUM ('INCOME', 'EXPENSE');

-- CreateTable
CREATE TABLE "ExpenseLedgerEntry" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "kind" "ExpenseLedgerKind" NOT NULL,
    "category" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExpenseLedgerEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExpenseBudget" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "limitAmount" DECIMAL(14,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExpenseBudget_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ExpenseLedgerEntry_organizationId_occurredAt_idx" ON "ExpenseLedgerEntry"("organizationId", "occurredAt");

-- CreateIndex
CREATE INDEX "ExpenseLedgerEntry_organizationId_kind_occurredAt_idx" ON "ExpenseLedgerEntry"("organizationId", "kind", "occurredAt");

-- CreateIndex
CREATE UNIQUE INDEX "ExpenseBudget_organizationId_category_key" ON "ExpenseBudget"("organizationId", "category");

-- AddForeignKey
ALTER TABLE "ExpenseLedgerEntry" ADD CONSTRAINT "ExpenseLedgerEntry_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpenseBudget" ADD CONSTRAINT "ExpenseBudget_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
