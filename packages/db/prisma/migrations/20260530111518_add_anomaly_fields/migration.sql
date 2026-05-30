-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "anomalyReason" TEXT,
ADD COLUMN     "anomalyScore" DOUBLE PRECISION,
ADD COLUMN     "isAnomaly" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "customAnomalyThreshold" DOUBLE PRECISION;
