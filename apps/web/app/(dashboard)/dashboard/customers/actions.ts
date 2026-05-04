"use server";

import { prisma } from "@repo/db";
import { requireAuth } from "../../../../lib/auth";
import { revalidatePath } from "next/cache";

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
