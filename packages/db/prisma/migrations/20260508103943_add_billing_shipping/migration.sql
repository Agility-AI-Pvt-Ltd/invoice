-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "billingAddress" TEXT,
ADD COLUMN     "shippingAddress" TEXT,
ADD COLUMN     "shippingName" TEXT;
