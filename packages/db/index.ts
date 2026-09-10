import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import "dotenv/config";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Add it to .env locally or Vercel project settings.",
    );
  }

  const pool = new Pool({
    connectionString,
    // Neon PgBouncer (transaction mode): keep pool small to avoid
    // stale connections and "Authentication timed out" errors.
    max: 5,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 15_000,
    allowExitOnIdle: false,
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

// Reuse one client per serverless instance (Vercel, etc.) to avoid connection storms.
globalForPrisma.prisma = prisma;

// Export types specifically to avoid Turbopack wildcard export warnings for CJS
export type {
  User,
  Product,
  Invoice,
  InvoiceItem,
  Customer,
  Organization,
  ActivityLog,
} from "@prisma/client";

// Export enums explicitly
export {
  InvoiceStatus,
  ProductKind,
  InventoryMovementType,
  ExpenseLedgerKind,
  Prisma,
} from "@prisma/client";
