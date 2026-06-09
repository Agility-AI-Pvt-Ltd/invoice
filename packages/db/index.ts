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
    // Neon PgBouncer (transaction mode): keep pool small to avoid
    // stale connections and "Authentication timed out" errors.
    // Increase slightly for resilience in dev where network can
    // be flaky (Neon, TLS handshakes, etc.). Keep pool small
    // but allow a couple concurrent connections.
    max: 2,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 30_000,
    keepAlive: true,
    allowExitOnIdle: false,
    // TLS for hosted Postgres. Relax cert verification in local
    // development to avoid provider certificate issues.
    ssl:
      process.env.NODE_ENV === "production"
        ? undefined
        : { rejectUnauthorized: false } as any,
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
  ExpenseLedgerKind,
  Prisma
} from "@prisma/client";
