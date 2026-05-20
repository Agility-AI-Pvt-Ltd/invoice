"use server";

import { prisma } from "@repo/db";
import { requireAuth } from "../../../../lib/auth";
import { revalidatePath } from "next/dist/server/web/spec-extension/revalidate";

export async function addCustomer(formData: FormData) {
  const user = await requireAuth();
  const organizationId = user.ownedOrgs[0]?.id;
  if (!organizationId) return { error: "No organization found." };

  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const phone = formData.get("phone") as string;
  const gstin = formData.get("gstin") as string;
  const stateCode = formData.get("stateCode") as string;
  const address = formData.get("address") as string;
  const isRegistered = formData.get("isRegistered") === "true";

  if (!name || !stateCode) return { error: "Name and State Code are required." };

  try {
    await prisma.customer.create({
      data: {
        organizationId,
        name,
        email: email || null,
        phone: phone || null,
        gstin: gstin || null,
        stateCode,
        address: address || null,
        isRegistered,
      },
    });
    revalidatePath("/dashboard/customers");
  } catch (err: any) {
    return { error: "Failed to save customer." };
  }
}

export async function updateCustomer(id: string, formData: FormData) {
  const user = await requireAuth();
  const organizationId = user.ownedOrgs[0]?.id;
  if (!organizationId) return { error: "No organization found." };

  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const phone = formData.get("phone") as string;
  const gstin = formData.get("gstin") as string;
  const stateCode = formData.get("stateCode") as string;
  const address = formData.get("address") as string;
  const isRegistered = formData.get("isRegistered") === "true";

  if (!name || !stateCode) return { error: "Name and State Code are required." };

  try {
    await prisma.customer.update({
      where: { id, organizationId },
      data: {
        name,
        email: email || null,
        phone: phone || null,
        gstin: gstin || null,
        stateCode,
        address: address || null,
        isRegistered,
      },
    });
    revalidatePath("/dashboard/customers");
  } catch (err: any) {
    return { error: "Failed to update customer." };
  }
}

export async function deleteCustomer(id: string) {
  const user = await requireAuth();
  const organizationId = user.ownedOrgs[0]?.id;
  if (!organizationId) return { error: "No organization found." };

  try {
    // Check if customer has invoices
    const invoiceCount = await prisma.invoice.count({
      where: { customerId: id, organizationId }
    });

    if (invoiceCount > 0) {
      return { error: "Cannot delete customer with existing invoices. Please cancel the invoices first." };
    }

    await prisma.customer.delete({
      where: { id, organizationId }
    });
    revalidatePath("/dashboard/customers");
  } catch (err: any) {
    return { error: "Failed to delete customer." };
  }
}
