import { NextResponse } from 'next/server';
import { prisma } from '@repo/db';
import { getSession } from '@/lib/auth';
import { computeInvoiceTotals, validateItems } from '@/lib/gst';
import { buildInvoiceItemCreates } from '@/lib/domain/inventory';

// GET /api/invoices/[id] — fetch single invoice (for edit form)
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getSession();
  const organizationId = user?.ownedOrgs?.[0]?.id;
  if (!organizationId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const invoice = await prisma.invoice.findUnique({
    where: { id, organizationId },
    include: { customer: true, items: true },
  });

  if (!invoice) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(invoice);
}

// PUT /api/invoices/[id] — update invoice (only non-PAID/CANCELLED invoices)
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getSession();
    const organization = user?.ownedOrgs?.[0];
    if (!organization) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const existing = await prisma.invoice.findUnique({
      where: { id, organizationId: organization.id },
    });
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (existing.status === 'PAID' || existing.status === 'CANCELLED') {
      return NextResponse.json(
        { error: `Cannot edit a ${existing.status} invoice.` },
        { status: 400 }
      );
    }

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
    } = body;

    if (!invoiceNumber || !issueDate || !dueDate || !customerNameOrId || !items?.length) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (new Date(dueDate) < new Date(issueDate)) {
      return NextResponse.json({ error: 'Due date cannot be before issue date' }, { status: 400 });
    }

    const itemError = validateItems(items);
    if (itemError) return NextResponse.json({ error: itemError }, { status: 400 });

    // Resolve customer
    let customer =
      (await prisma.customer.findFirst({ where: { id: customerNameOrId, organizationId: organization.id } }).catch(() => null)) ??
      (await prisma.customer.findFirst({ where: { name: customerNameOrId, organizationId: organization.id } }).catch(() => null));

    if (!customer) {
      if (!customerStateCode && !organization.stateCode) {
        return NextResponse.json({ error: 'Customer state code is required for new customers' }, { status: 400 });
      }
      customer = await prisma.customer.create({
        data: {
          organizationId: organization.id,
          name: customerNameOrId,
          stateCode: customerStateCode || organization.stateCode,
          isRegistered: false,
        },
      });
    }

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

    const updated = await prisma.$transaction(async (tx) => {
      await tx.invoiceItem.deleteMany({ where: { invoiceId: id } });
      const itemCreates = await buildInvoiceItemCreates(
        tx,
        organization.id,
        items,
        processedItems
      );
      return tx.invoice.update({
        where: { id },
        data: {
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
          billingAddress,
          shippingAddress,
          shippingName,
          items: { create: itemCreates },
        },
        include: { items: true, customer: true },
      });
    });

    await prisma.activityLog
      .create({
        data: {
          organizationId: organization.id,
          entity: "Invoice",
          entityId: id,
          action: "UPDATED",
          meta: { invoiceNumber, total: grandTotal, discountTotal },
        },
      })
      .catch(() => {});

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('[invoices/update]', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Invoice number already exists.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/invoices/[id] — soft-cancel only; never hard-delete financial records
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getSession();
    const organizationId = user?.ownedOrgs?.[0]?.id;
    if (!organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const existing = await prisma.invoice.findUnique({ where: { id, organizationId } });
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (existing.status === 'PAID') {
      return NextResponse.json({ error: 'Cannot cancel a paid invoice.' }, { status: 400 });
    }
    if (existing.status === 'CANCELLED') {
      return NextResponse.json({ error: 'Invoice is already cancelled.' }, { status: 400 });
    }

    // Always soft-cancel — financial records must never be hard-deleted
    await prisma.$transaction([
      prisma.invoice.update({ where: { id }, data: { status: 'CANCELLED' } }),
      prisma.activityLog.create({
        data: {
          organizationId,
          entity: 'Invoice',
          entityId: id,
          action: 'CANCELLED',
          meta: { previousStatus: existing.status },
        },
      }),
    ]);

    return NextResponse.json({ cancelled: true });
  } catch (error) {
    console.error('[invoices/delete]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
