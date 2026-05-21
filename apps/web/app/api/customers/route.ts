import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { getSession } from "../../../lib/auth";
import {
  createCustomerSchema,
  validateRequestBody,
  type CreateCustomerInput,
} from "@/lib/validation-schemas";
import {
  ApiErrors,
  createErrorResponse,
  verifyOrgAccess,
  logApiAction,
} from "@/lib/api-utils";

export async function POST(request: Request) {
  try {
    const user = await getSession();
    const organizationId = user?.ownedOrgs?.[0]?.id;

    const orgAccess = verifyOrgAccess(user, organizationId);
    if (!orgAccess.hasAccess) {
      return NextResponse.json(
        { error: orgAccess.error.message },
        { status: orgAccess.error.status },
      );
    }

    const orgId = orgAccess.org.id;

    // Validate request body
    const validation = await validateRequestBody(request, createCustomerSchema);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const data = validation.data;

    // Check for duplicate customer name
    const existingCustomer = await prisma.customer.findFirst({
      where: {
        organizationId: orgId,
        name: {equals: data.name, mode: "insensitive" },
      },
    });

    if (existingCustomer) {
      return NextResponse.json(
        { error: `Customer "${data.name}" already exists` },
        { status: 409 },
      );
    }

    const customer = await prisma.customer.create({
      data: {
        organizationId: orgId,
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        gstin: data.gstin || null,
        stateCode: data.stateCode,
        address: data.address || null,
        isRegistered: data.isRegistered,
      },
      select: { id: true, name: true, stateCode: true, email: true },
    });

    // Log action
    await logApiAction(prisma, orgId, "Customer", customer.id, "CREATED", {
      name: customer.name,
    });

    return NextResponse.json(customer, { status: 201 });
  } catch (err) {
    return createErrorResponse(err, "POST /api/customers");
  }
}
