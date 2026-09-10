"use server";

import { prisma } from "@repo/db";
import { requireAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { logger } from "@/lib/logger";
import { Decimal } from "decimal.js";
import { toStoredAmount } from "@/lib/money";

/**
 * Normalizes optional string fields from FormData.
 * Returns null if empty, to avoid unique constraint issues with "" in Postgres.
 */
function normalize(val: FormDataEntryValue | null): string | null {
  const s = val ? String(val).trim() : "";
  return s === "" ? null : s;
}

export async function addProduct(formData: FormData) {
  const context = "action:product:add";
  try {
    const user = await requireAuth();
    const organizationId = user.ownedOrgs[0]?.id;
    if (!organizationId) throw new Error("No organization found");

    const name = normalize(formData.get("name"))!;
    const price = toStoredAmount(formData.get("price") as string || "0");
    const hsnCode = normalize(formData.get("hsnCode"));
    const taxRate = new Decimal(formData.get("taxRate") as string || "0").toDecimalPlaces(2).toString();
    const sku = normalize(formData.get("sku"));
    const productKind = (formData.get("productKind") as "GOOD" | "SERVICE") || "SERVICE";

    await prisma.product.create({
      data: {
        organizationId,
        name,
        price,
        hsnCode,
        taxRate,
        sku,
        productKind,
      },
    });

    revalidatePath("/dashboard/products");
    return { success: true };
  } catch (err: any) {
    logger.error(context, "Failed to add product", err);
    if (err.code === "P2002") {
      const field = err.meta?.target?.includes("sku") ? "SKU" : "field";
      return { error: `A product with this ${field} already exists in your catalog.` };
    }
    return { error: err.message || "An unexpected error occurred." };
  }
}

export async function updateProduct(id: string, formData: FormData) {
  const context = "action:product:update";
  try {
    const user = await requireAuth();
    const organizationId = user.ownedOrgs[0]?.id;
    if (!organizationId) throw new Error("No organization found");

    const name = normalize(formData.get("name"))!;
    const price = toStoredAmount(formData.get("price") as string || "0");
    const hsnCode = normalize(formData.get("hsnCode"));
    const taxRate = new Decimal(formData.get("taxRate") as string || "0").toDecimalPlaces(2).toString();
    const sku = normalize(formData.get("sku"));
    const productKind = (formData.get("productKind") as "GOOD" | "SERVICE") || "SERVICE";

    await prisma.product.update({
      where: { id, organizationId },
      data: {
        name,
        price,
        hsnCode,
        taxRate,
        sku,
        productKind,
      },
    });

    revalidatePath("/dashboard/products");
    return { success: true };
  } catch (err: any) {
    logger.error(context, "Failed to update product", err, { productId: id });
    if (err.code === "P2002") {
      const field = err.meta?.target?.includes("sku") ? "SKU" : "field";
      return { error: `A product with this ${field} already exists in your catalog.` };
    }
    return { error: err.message || "An unexpected error occurred." };
  }
}

export async function deleteProduct(id: string) {
  const context = "action:product:delete";
  try {
    const user = await requireAuth();
    const organizationId = user.ownedOrgs[0]?.id;
    if (!organizationId) throw new Error("No organization found");
    
    await prisma.product.delete({
      where: { id, organizationId }
    });

    revalidatePath("/dashboard/products");
    return { success: true };
  } catch (err: any) {
    logger.error(context, "Failed to delete product", err, { productId: id });
    return { error: err.message || "An unexpected error occurred." };
  }
}
