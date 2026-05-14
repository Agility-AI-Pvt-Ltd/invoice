import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import "dotenv/config";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  const adapter = new PrismaPg(pool);

  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Export types specifically to avoid Turbopack wildcard export warnings for CJS
export type { 
  User,
  Product, 
  Invoice, 
  InvoiceItem, 
  Customer, 
  Organization, 
  ActivityLog
} from "@prisma/client";

// Export enums explicitly
export { 
  InvoiceStatus, 
  ProductKind,
  InventoryMovementType,
  Prisma
} from "@prisma/client";
