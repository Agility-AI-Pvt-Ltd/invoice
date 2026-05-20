import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { computeInvoiceTotals, validateItems } from "../../../lib/gst";
import { buildInvoiceItemCreates } from "@/lib/domain/inventory";
import { ApiErrors, handleApiError, successResponse } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { stateCodeSchema, indianPhoneSchema } from "@repo/domain";
import { getSessionOrThrow, getOrgOrThrow } from "../../../lib/auth";
import { enforceRateLimit, expensiveActionLimit } from "@/lib/ratelimit-api";

export async function POST(request: Request) {
  const context = "api:invoices:create";
  try {
    const user = await getSessionOrThrow();
    const organization = getOrgOrThrow(user);

    // Rate Limit: 5 invoices per minute per organization
    await enforceRateLimit(`invoice:create:${organization.id}`, expensiveActionLimit);

    const body = await request.json();
    const {
      invoiceNumber,
      issueDate,
      dueDate,
      customerNameOrId,
      customerStateCode,
      customerEmail,
      customerPhone,
      placeOfSupply,
      notes,
      items,
      isInterState: manualInterState,
      billingAddress,
      shippingAddress,
      shippingName,
      customerDetails,
    } = body;

    // 1. Basic Validation
    if (!invoiceNumber || !issueDate || !dueDate || !customerNameOrId || !items?.length) {
      throw ApiErrors.BAD_REQUEST("Missing required fields");
    }

    if (customerStateCode) {
      const result = stateCodeSchema.safeParse(customerStateCode);
      if (!result.success) throw ApiErrors.BAD_REQUEST(result.error.issues[0]?.message);
    }

    if (customerPhone) {
      const result = indianPhoneSchema.safeParse(customerPhone);
      if (!result.success) throw ApiErrors.BAD_REQUEST(result.error.issues[0]?.message);
    }

    if (placeOfSupply) {
      const result = stateCodeSchema.safeParse(placeOfSupply);
      if (!result.success) throw ApiErrors.BAD_REQUEST(`Place of Supply: ${result.error.issues[0]?.message}`);
    }

    if (new Date(dueDate) < new Date(issueDate)) {
      throw ApiErrors.BAD_REQUEST("Due date cannot be before issue date");
    }

    const itemError = validateItems(items);
    if (itemError) throw ApiErrors.BAD_REQUEST(itemError);

    // 2. Atomic Database Operations
    const result = await prisma.$transaction(async (tx) => {
      // 2a. Resolve or Create Customer
      let customer = await tx.customer.findUnique({
        where: { id: customerNameOrId, organizationId: organization.id },
      });

      if (!customer) {
        const matchingCustomers = await tx.customer.findMany({
          where: {
            organizationId: organization.id,
            name: { equals: customerNameOrId, mode: "insensitive" },
          },
          orderBy: { createdAt: "asc" },
          take: 2,
        });

        if (matchingCustomers.length > 1) {
          throw ApiErrors.CONFLICT(
            `Multiple customers match "${customerNameOrId}". Use the customer ID to create this invoice.`
          );
        }

        customer = matchingCustomers[0] ?? null;
      }

      if (!customer) {
        if (!customerStateCode && !organization.stateCode) {
          throw ApiErrors.BAD_REQUEST("Customer state code is required for new customers");
        }
        customer = await tx.customer.create({
          data: {
            organizationId: organization.id,
            name: customerNameOrId,
            stateCode: customerStateCode || organization.stateCode!,
            email: customerEmail || null,
            phone: customerPhone || null,
            isRegistered: false,
          },
        });
      }

      // 2b. Auto-save Products
      for (const item of items) {
        if (item.description) {
          const exists = await tx.product.findFirst({
            where: { organizationId: organization.id, name: item.description },
          });
          if (!exists) {
            await tx.product.create({
              data: {
                organizationId: organization.id,
                name: item.description,
                price: Number(item.unitPrice) || 0,
                hsnCode: item.hsnCode || null,
                taxRate: Number(item.taxRate) || 0,
              },
            });
          }
        }
      }

      // 2c. Calculate Totals
      const effectivePlaceOfSupply = placeOfSupply || customer.stateCode || "";
      const orgState = (organization.stateCode || "").match(/\d+/)?.[0] || "";
      const supplyState = effectivePlaceOfSupply.match(/\d+/)?.[0] || "";
      const isInterState = typeof manualInterState === 'boolean' 
        ? manualInterState 
        : (!!orgState && !!supplyState && orgState !== supplyState);

      const totals = computeInvoiceTotals(items, isInterState);

      // 2d. Create Invoice Items
      const itemCreates = await buildInvoiceItemCreates(
        tx,
        organization.id,
        items,
        totals.processedItems,
      );

      // 2e. Create Invoice
      const invoice = await tx.invoice.create({
        data: {
          organizationId: organization.id,
          customerId: customer.id,
          invoiceNumber,
          issueDate: new Date(issueDate),
          dueDate: new Date(dueDate),
          placeOfSupply: effectivePlaceOfSupply,
          notes: notes || null,
          subTotal: totals.subTotal,
          cgstTotal: totals.cgstTotal,
          sgstTotal: totals.sgstTotal,
          igstTotal: totals.igstTotal,
          discountTotal: totals.discountTotal,
          total: totals.grandTotal,
          status: "DRAFT",
          billingAddress,
          shippingAddress,
          shippingName,
          customerDetails,
          items: { create: itemCreates },
        },
        include: { items: true, customer: true },
      });

      // 2f. Activity Log (Now inside transaction for atomicity)
      await tx.activityLog.create({
        data: {
          organizationId: organization.id,
          entity: "Invoice",
          entityId: invoice.id,
          action: "CREATED",
          meta: { invoiceNumber, total: totals.grandTotal, discountTotal: totals.discountTotal },
        },
      });

      return invoice;
    });

    logger.info(context, "Invoice created successfully", { invoiceId: result.id, invoiceNumber });
    return successResponse(result, 201);

  } catch (error: any) {
    if (error.code === "P2002") {
      return handleApiError(ApiErrors.CONFLICT("Invoice number already exists"), context);
    }
    return handleApiError(error, context);
  }
}
