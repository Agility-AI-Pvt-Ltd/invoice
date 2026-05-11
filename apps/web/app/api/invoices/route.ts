import { NextResponse } from 'next/server';
import { prisma } from '@repo/db';
import { getSession } from '../../../lib/auth';
import { computeInvoiceTotals, validateItems } from '../../../lib/gst';
import { buildInvoiceItemCreates } from '@/lib/domain/inventory';

export async function POST(request: Request) {
  try {
    const user = await getSession();
    const organization = user?.ownedOrgs?.[0];
    if (!organization) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
<<<<<<< Updated upstream
=======
      isInterState: manualInterState,
      billingAddress,
      shippingAddress,
      shippingName,
>>>>>>> Stashed changes
    } = body;

    if (!invoiceNumber || !issueDate || !dueDate || !customerNameOrId || !items || items.length === 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (new Date(dueDate) < new Date(issueDate)) {
      return NextResponse.json({ error: 'Due date cannot be before issue date' }, { status: 400 });
    }

    const itemError = validateItems(items);
    if (itemError) return NextResponse.json({ error: itemError }, { status: 400 });

    // Resolve customer: by ID → by exact name → create
    let customer =
      (await prisma.customer.findFirst({
        where: { id: customerNameOrId, organizationId: organization.id },
      }).catch(() => null)) ??
      (await prisma.customer.findFirst({
        where: { name: customerNameOrId, organizationId: organization.id },
      }).catch(() => null));

    if (!customer) {
      if (!customerStateCode && !organization.stateCode) {
        return NextResponse.json({ error: 'Customer state code is required for new customers' }, { status: 400 });
      }
      customer = await prisma.customer.create({
        data: {
          organizationId: organization.id,
          name: customerNameOrId,
          stateCode: customerStateCode || organization.stateCode,
          email: customerEmail || null,
          phone: customerPhone || null,
          isRegistered: false,
        },
      });
    }

<<<<<<< Updated upstream
    const effectivePlaceOfSupply = placeOfSupply || customer.stateCode;
    const isInterState = organization.stateCode !== effectivePlaceOfSupply;
    const { subTotal, cgstTotal, sgstTotal, igstTotal, grandTotal, processedItems } =
      computeInvoiceTotals(items, isInterState);
=======
    const effectivePlaceOfSupply = placeOfSupply || customer.stateCode || "";
    const orgState = (organization.stateCode || "").match(/\d+/)?.[0] || "";
    const supplyState = effectivePlaceOfSupply.match(/\d+/)?.[0] || "";
    const isInterState = typeof manualInterState === 'boolean' 
      ? manualInterState 
      : (!!orgState && !!supplyState && orgState !== supplyState);
    const {
      subTotal,
      cgstTotal,
      sgstTotal,
      igstTotal,
      discountTotal,
      grandTotal,
      processedItems,
    } = computeInvoiceTotals(items, isInterState);
>>>>>>> Stashed changes

    const invoice = await prisma.$transaction(async (tx) => {
      // Auto-save new products inline (best-effort, non-blocking)
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

      const itemCreates = await buildInvoiceItemCreates(
        tx,
        organization.id,
        items,
        processedItems
      );

      return tx.invoice.create({
        data: {
          organizationId: organization.id,
          customerId: customer!.id,
          invoiceNumber,
          issueDate: new Date(issueDate),
          dueDate: new Date(dueDate),
          placeOfSupply: effectivePlaceOfSupply,
          notes: notes || null,
          subTotal,
          cgstTotal,
          sgstTotal,
          igstTotal,
          discountTotal,
          total: grandTotal,
<<<<<<< Updated upstream
          status: 'DRAFT',
=======
          status: "DRAFT",
          billingAddress,
          shippingAddress,
          shippingName,
>>>>>>> Stashed changes
          items: { create: itemCreates },
        },
        include: { items: true, customer: true },
      });
    });

<<<<<<< Updated upstream
    await prisma.activityLog.create({
      data: {
        organizationId: organization.id,
        entity: 'Invoice',
        entityId: invoice.id,
        action: 'CREATED',
        meta: { invoiceNumber, total: grandTotal },
      },
    }).catch(() => {});
=======
    await prisma.activityLog
      .create({
        data: {
          organizationId: organization.id,
          entity: "Invoice",
          entityId: invoice.id,
          action: "CREATED",
          meta: { invoiceNumber, total: grandTotal, discountTotal },
        },
      })
      .catch(() => {});
>>>>>>> Stashed changes

    return NextResponse.json(invoice, { status: 201 });
  } catch (error: any) {
    console.error('[invoices/create]', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Invoice number already exists.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
