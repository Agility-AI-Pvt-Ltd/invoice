import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { computeInvoiceTotals, validateItems } from "@/lib/gst";
import { buildInvoiceItemCreates } from "@/lib/domain/inventory";
import { ApiErrors, handleApiError, successResponse } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { stateCodeSchema } from "@repo/domain";
import { getSessionOrThrow, getOrgOrThrow } from "@/lib/auth";
import { enforceRateLimit, apiRateLimit } from "@/lib/ratelimit-api";

// GET /api/invoices/[id]
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const context = "api:invoices:get";
  try {
    const { id } = await params;
    const user = await getSessionOrThrow();
    const organization = getOrgOrThrow(user);

    const invoice = await prisma.invoice.findUnique({
      where: { id, organizationId: organization.id },
      include: { customer: true, items: true },
    });

    if (!invoice) throw ApiErrors.NOT_FOUND("Invoice not found");
    return successResponse(invoice);
  } catch (error) {
    return handleApiError(error, context);
  }
}

// PUT /api/invoices/[id]
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const context = "api:invoices:update";
  try {
    const { id } = await params;
    const user = await getSessionOrThrow();
    const organization = getOrgOrThrow(user);

    await enforceRateLimit(`invoice:update:${organization.id}`, apiRateLimit);

    const body = await req.json();
    const {
      invoiceNumber,
      issueDate,
      dueDate,
      customerNameOrId,
      customerStateCode,
      placeOfSupply,
      notes,
      items,
      isInterState: manualInterState,
      billingAddress,
      shippingAddress,
      shippingName,
      customerDetails,
    } = body;

    // 1. Validation
    if (!invoiceNumber || !issueDate || !dueDate || !customerNameOrId || !items?.length) {
      throw ApiErrors.BAD_REQUEST("Missing required fields");
    }

    if (customerStateCode) {
      const result = stateCodeSchema.safeParse(customerStateCode);
      if (!result.success) throw ApiErrors.BAD_REQUEST(`Customer State: ${result.error.errors[0]?.message}`);
    }

    if (placeOfSupply) {
      const result = stateCodeSchema.safeParse(placeOfSupply);
      if (!result.success) throw ApiErrors.BAD_REQUEST(`Place of Supply: ${result.error.errors[0]?.message}`);
    }

    if (new Date(dueDate) < new Date(issueDate)) {
      throw ApiErrors.BAD_REQUEST("Due date cannot be before issue date");
    }

    const itemError = validateItems(items);
    if (itemError) throw ApiErrors.BAD_REQUEST(itemError);

    // 2. Atomic Transaction
    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.invoice.findUnique({
        where: { id, organizationId: organization.id },
      });

      if (!existing) throw ApiErrors.NOT_FOUND("Invoice not found");
      if (existing.status === "PAID" || existing.status === "CANCELLED") {
        throw ApiErrors.BAD_REQUEST(`Cannot edit a ${existing.status} invoice.`);
      }

      // 2a. Resolve Customer
      let customer = await tx.customer.findFirst({
        where: { 
          OR: [{ id: customerNameOrId }, { name: customerNameOrId }],
          organizationId: organization.id 
        },
      });

      if (!customer) {
        if (!customerStateCode && !organization.stateCode) {
          throw ApiErrors.BAD_REQUEST("Customer state code is required for new customers");
        }
        customer = await tx.customer.create({
          data: {
            organizationId: organization.id,
            name: customerNameOrId,
            stateCode: customerStateCode || organization.stateCode!,
            isRegistered: false,
          },
        });
      }

      // 2b. Calculate Totals
      const effectivePlaceOfSupply = placeOfSupply || customer.stateCode || "";
      const orgState = (organization.stateCode || "").match(/\d+/)?.[0] || "";
      const supplyState = effectivePlaceOfSupply.match(/\d+/)?.[0] || "";
      const isInterState = typeof manualInterState === 'boolean'
        ? manualInterState
        : (!!orgState && !!supplyState && orgState !== supplyState);

      const totals = computeInvoiceTotals(items, isInterState);

      // 2c. Sync Invoice Items
      await tx.invoiceItem.deleteMany({ where: { invoiceId: id } });
      const itemCreates = await buildInvoiceItemCreates(
        tx,
        organization.id,
        items,
        totals.processedItems,
      );

      // 2d. Update Invoice
      const updated = await tx.invoice.update({
        where: { id },
        data: {
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
          billingAddress,
          shippingAddress,
          shippingName,
          customerDetails,
          items: { create: itemCreates },
        },
        include: { items: true, customer: true },
      });

      // 2e. Audit Log
      await tx.activityLog.create({
        data: {
          organizationId: organization.id,
          entity: "Invoice",
          entityId: id,
          action: "UPDATED",
          meta: { invoiceNumber, total: totals.grandTotal, discountTotal: totals.discountTotal },
        },
      });

      return updated;
    });

    logger.info(context, "Invoice updated successfully", { invoiceId: result.id, invoiceNumber });
    return successResponse(result);
  } catch (error: any) {
    if (error.code === "P2002") {
      return handleApiError(ApiErrors.CONFLICT("Invoice number already exists"), context);
    }
    return handleApiError(error, context);
  }
}

// DELETE /api/invoices/[id]
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const context = "api:invoices:delete";
  try {
    const { id } = await params;
    const user = await getSessionOrThrow();
    const organization = getOrgOrThrow(user);
    
    await enforceRateLimit(`invoice:delete:${organization.id}`, apiRateLimit);

    await prisma.$transaction(async (tx) => {
      const existing = await tx.invoice.findUnique({
        where: { id, organizationId: organization.id },
      });

      if (!existing) throw ApiErrors.NOT_FOUND("Invoice not found");
      if (existing.status === "PAID") throw ApiErrors.BAD_REQUEST("Cannot cancel a paid invoice.");
      if (existing.status === "CANCELLED") throw ApiErrors.BAD_REQUEST("Invoice is already cancelled.");

      await tx.invoice.update({ where: { id }, data: { status: "CANCELLED" } });
      await tx.activityLog.create({
        data: {
          organizationId: organization.id,
          entity: "Invoice",
          entityId: id,
          action: "CANCELLED",
          meta: { previousStatus: existing.status },
        },
      });
    });

    logger.info(context, "Invoice cancelled successfully", { invoiceId: id });
    return successResponse({ success: true, message: "Invoice cancelled" });
  } catch (error) {
    return handleApiError(error, context);
  }
}
