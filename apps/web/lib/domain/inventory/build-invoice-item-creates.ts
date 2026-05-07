import type { Prisma } from "@repo/db";
import type { ProcessedItem } from "@/lib/gst";

/** Resolves optional client-supplied productId values to org-scoped catalog IDs for InvoiceItem.create. */
export async function buildInvoiceItemCreates(
  tx: Prisma.TransactionClient,
  organizationId: string,
  rawItems: Array<{ productId?: string | null | undefined }>,
  processedItems: ProcessedItem[]
): Promise<Prisma.InvoiceItemCreateWithoutInvoiceInput[]> {
  const ids = [
    ...new Set(
      rawItems
        .map((i) => i.productId)
        .filter((x): x is string => typeof x === "string" && x.length > 0)
    ),
  ];
  const valid =
    ids.length === 0
      ? []
      : await tx.product.findMany({
          where: { organizationId, id: { in: ids } },
          select: { id: true },
        });
  const validSet = new Set(valid.map((p) => p.id));

  return processedItems.map((pi, i) => ({
    description: pi.description,
    hsnCode: pi.hsnCode,
    quantity: pi.quantity,
    unitPrice: pi.unitPrice,
    taxRate: pi.taxRate,
    cgstAmount: pi.cgstAmount,
    sgstAmount: pi.sgstAmount,
    igstAmount: pi.igstAmount,
    total: pi.total,
    productId:
      rawItems[i]?.productId && validSet.has(rawItems[i].productId!)
        ? rawItems[i].productId
        : undefined,
  }));
}
