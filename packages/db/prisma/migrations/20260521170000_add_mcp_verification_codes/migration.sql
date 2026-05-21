CREATE TABLE "McpVerificationCode" (
    "id" TEXT NOT NULL,
    "hashedCode" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "McpVerificationCode_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "McpVerificationCode_hashedCode_key" ON "McpVerificationCode"("hashedCode");
CREATE INDEX "McpVerificationCode_expiresAt_idx" ON "McpVerificationCode"("expiresAt");
CREATE INDEX "McpVerificationCode_userId_organizationId_idx" ON "McpVerificationCode"("userId", "organizationId");

ALTER TABLE "McpVerificationCode"
ADD CONSTRAINT "McpVerificationCode_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "McpVerificationCode"
ADD CONSTRAINT "McpVerificationCode_organizationId_fkey"
FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
