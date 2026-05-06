import type { Prisma } from "@repo/db";

/** Ensures one default warehouse per org (MVP single-warehouse model; extend for multi-site later). */
export async function getOrCreateDefaultWarehouse(
  tx: Prisma.TransactionClient,
  organizationId: string
) {
  const existing = await tx.warehouse.findFirst({
    where: { organizationId, isDefault: true },
  });
  if (existing) return existing;
  return tx.warehouse.create({
    data: {
      organizationId,
      name: "Default",
      isDefault: true,
    },
  });
}
