import { Prisma } from "@prisma/client";
import { getOrCreateDefaultWarehouse } from "./warehouse";

/** Inventory deduction runs once the invoice has started settling (cash in), not only when fully paid. */
const DEDUCT_STATUSES = new Set(["PARTIALLY_PAID", "PAID"]);

function shouldApplyInventoryDeduction(previousStatus: string, newStatus: string): boolean {
  if (!DEDUCT_STATUSES.has(newStatus)) return false;
  // First time we enter a "payment received" state; later payments (PARTIALLY_PAID → PAID) skip via idempotency + this guard.
  if (DEDUCT_STATUSES.has(previousStatus)) return false;
  return true;
}

/**
 * When an invoice first reaches PARTIALLY_PAID or PAID, deduct stock for lines linked to catalog goods (productKind GOOD).
 * Idempotent per invoice line via InventoryMovement.idempotencyKey.
 * Call inside the same DB transaction that records the payment and updates status.
 */
export async function applyInventoryOnFullPayment(
  tx: Prisma.TransactionClient,
  params: {
    organizationId: string;
    invoiceId: string;
    previousStatus: string;
    newStatus: string;
  }
): Promise<void> {
  if (!shouldApplyInventoryDeduction(params.previousStatus, params.newStatus)) return;
  const org = await tx.organization.findUnique({
    where: { id: params.organizationId },
    select: { inventoryTrackingEnabled: true },
  });
  if (!org?.inventoryTrackingEnabled) return;

  const invoice = await tx.invoice.findFirst({
    where: { id: params.invoiceId, organizationId: params.organizationId },
    include: {
      items: {
        include: {
          product: { select: { id: true, productKind: true } },
        },
      },
    },
  });
  if (!invoice) return;

  const warehouse = await getOrCreateDefaultWarehouse(tx, params.organizationId);

  for (const line of invoice.items) {
    if (!line.productId || !line.product || line.product.productKind !== "GOOD") continue;

    const idempotencyKey = `sale-paid:${invoice.id}:${line.id}`;
    const exists = await tx.inventoryMovement.findUnique({
      where: { idempotencyKey },
    });
    if (exists) continue;

    const qty = new Prisma.Decimal(line.quantity);

    const invRow = await tx.inventoryItem.findUnique({
      where: {
        warehouseId_productId: {
          warehouseId: warehouse.id,
          productId: line.productId,
        },
      },
    });
    if (!invRow) {
      throw new Error(
        `INSUFFICIENT_STOCK_SETUP: No stock row for product "${line.description}". Open Inventory and add stock for this SKU.`
      );
    }

    const nextQty = invRow.quantityOnHand.minus(qty);
    if (nextQty.lt(0)) {
      throw new Error(
        `INSUFFICIENT_STOCK: Not enough stock for "${line.description}" (requested ${line.quantity}).`
      );
    }

    await tx.inventoryItem.update({
      where: { id: invRow.id },
      data: { quantityOnHand: nextQty },
    });

    await tx.inventoryMovement.create({
      data: {
        organizationId: params.organizationId,
        warehouseId: warehouse.id,
        productId: line.productId,
        type: "SALE",
        quantity: qty,
        invoiceId: invoice.id,
        invoiceItemId: line.id,
        idempotencyKey,
      },
    });
  }
}

/**
 * Restores stock when a PAID invoice is voided/reopened (use when you allow cancelling paid invoices).
 * Idempotent via idempotencyKey per source SALE movement.
 */
export async function reverseInventoryForPaidInvoice(
  tx: Prisma.TransactionClient,
  params: { organizationId: string; invoiceId: string }
): Promise<void> {
  const org = await tx.organization.findUnique({
    where: { id: params.organizationId },
    select: { inventoryTrackingEnabled: true },
  });
  if (!org?.inventoryTrackingEnabled) return;

  const sales = await tx.inventoryMovement.findMany({
    where: {
      invoiceId: params.invoiceId,
      organizationId: params.organizationId,
      type: "SALE",
    },
  });

  const warehouse = await getOrCreateDefaultWarehouse(tx, params.organizationId);

  for (const sale of sales) {
    const revKey = `sale-reversal:${sale.id}`;
    const already = await tx.inventoryMovement.findUnique({ where: { idempotencyKey: revKey } });
    if (already) continue;

    const invRow = await tx.inventoryItem.findUnique({
      where: {
        warehouseId_productId: {
          warehouseId: warehouse.id,
          productId: sale.productId,
        },
      },
    });
    if (!invRow) {
      await tx.inventoryItem.create({
        data: {
          warehouseId: warehouse.id,
          productId: sale.productId,
          quantityOnHand: sale.quantity,
        },
      });
    } else {
      await tx.inventoryItem.update({
        where: { id: invRow.id },
        data: { quantityOnHand: invRow.quantityOnHand.plus(sale.quantity) },
      });
    }

    await tx.inventoryMovement.create({
      data: {
        organizationId: params.organizationId,
        warehouseId: sale.warehouseId,
        productId: sale.productId,
        type: "SALE_REVERSAL",
        quantity: sale.quantity,
        invoiceId: params.invoiceId,
        invoiceItemId: sale.invoiceItemId,
        idempotencyKey: revKey,
        note: `Reversal of movement ${sale.id}`,
      },
    });
  }
}
