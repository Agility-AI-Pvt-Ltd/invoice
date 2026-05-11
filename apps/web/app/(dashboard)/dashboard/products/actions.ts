"use server";

import { prisma } from "@repo/db";
import { requireAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function addProduct(formData: FormData) {
  try {
    const user = await requireAuth();
    const organizationId = user.ownedOrgs[0]?.id;
    if (!organizationId) throw new Error("No organization found");

    const name = formData.get("name") as string;
    const price = parseFloat(formData.get("price") as string) || 0;
    const hsnCode = formData.get("hsnCode") as string;
    const taxRate = parseFloat(formData.get("taxRate") as string) || 0;
    const sku = formData.get("sku") as string;
    const productKind = formData.get("productKind") as "GOOD" | "SERVICE";

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
    return { error: err.message };
  }
}

export async function updateProduct(id: string, formData: FormData) {
  try {
    const user = await requireAuth();
    const organizationId = user.ownedOrgs[0]?.id;
    if (!organizationId) throw new Error("No organization found");

    const name = formData.get("name") as string;
    const price = parseFloat(formData.get("price") as string) || 0;
    const hsnCode = formData.get("hsnCode") as string;
    const taxRate = parseFloat(formData.get("taxRate") as string) || 0;
    const sku = formData.get("sku") as string;
    const productKind = formData.get("productKind") as "GOOD" | "SERVICE";

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
    return { error: err.message };
  }
}

export async function deleteProduct(id: string) {
  try {
    const user = await requireAuth();
    const organizationId = user.ownedOrgs[0]?.id;
    
    await prisma.product.delete({
      where: { id, organizationId }
    });

    revalidatePath("/dashboard/products");
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}
