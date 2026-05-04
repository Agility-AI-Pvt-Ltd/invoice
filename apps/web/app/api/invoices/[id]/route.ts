import { NextResponse } from 'next/server';
import { prisma } from '@repo/db';
import { getSession } from '../../../../../lib/auth';

function calculateGST(amount: number, taxRate: number, isInterState: boolean) {
  const totalTax = (amount * taxRate) / 100;
  if (isInterState) return { cgst: 0, sgst: 0, igst: totalTax };
  return { cgst: totalTax / 2, sgst: totalTax / 2, igst: 0 };
}

// GET /api/invoices/[id] — fetch single invoice (for edit form)
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getSession();
  if (!user || user.ownedOrgs.length === 0) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const organizationId = user.ownedOrgs[0].id;

  const invoice = await prisma.invoice.findUnique({
    where: { id, organizationId },
    include: { customer: true, items: true },
  });

  if (!invoice) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(invoice);
}

// PUT /api/invoices/[id] — update invoice (only DRAFT invoices)
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getSession();
    if (!user || user.ownedOrgs.length === 0) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const organization = user.ownedOrgs[0];

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
    const { invoiceNumber, issueDate, dueDate, customerNameOrId, customerStateCode, placeOfSupply, notes, items } = body;

    if (!invoiceNumber || !issueDate || !dueDate || !customerNameOrId || !items?.length) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Resolve customer
    let customer =
      (await prisma.customer.findFirst({ where: { id: customerNameOrId, organizationId: organization.id } }).catch(() => null)) ??
      (await prisma.customer.findFirst({ where: { name: customerNameOrId, organizationId: organization.id } }).catch(() => null));

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          organizationId: organization.id,
          name: customerNameOrId,
          stateCode: customerStateCode || organization.stateCode,
        },
      });
    }

    const effectivePlaceOfSupply = placeOfSupply || customer.stateCode;
    const isInterState = organization.stateCode !== effectivePlaceOfSupply;

    let subTotal = 0, cgstTotal = 0, sgstTotal = 0, igstTotal = 0;
    const processedItems = items.map((item: any) => {
      const itemSub = item.quantity * item.unitPrice;
      const taxes = calculateGST(itemSub, item.taxRate || 0, isInterState);
      subTotal += itemSub;
      cgstTotal += taxes.cgst;
      sgstTotal += taxes.sgst;
      igstTotal += taxes.igst;
      return {
        description: item.description,
        hsnCode: item.hsnCode || null,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxRate: item.taxRate || 0,
        cgstAmount: taxes.cgst,
        sgstAmount: taxes.sgst,
        igstAmount: taxes.igst,
        total: itemSub + taxes.cgst + taxes.sgst + taxes.igst,
      };
    });

    const grandTotal = subTotal + cgstTotal + sgstTotal + igstTotal;

    const updated = await prisma.$transaction(async (tx) => {
      // Delete old items and recreate
      await tx.invoiceItem.deleteMany({ where: { invoiceId: id } });
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
          total: grandTotal,
          items: { create: processedItems },
        },
        include: { items: true, customer: true },
      });
    });

    // Log
    await prisma.activityLog.create({
      data: {
        organizationId: organization.id,
        entity: 'Invoice',
        entityId: id,
        action: 'UPDATED',
        meta: { invoiceNumber, total: grandTotal },
      },
    }).catch(() => {});

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Failed to update invoice:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Invoice number already exists.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/invoices/[id] — cancel/delete DRAFT invoices only
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getSession();
  if (!user || user.ownedOrgs.length === 0) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const organizationId = user.ownedOrgs[0].id;

  const existing = await prisma.invoice.findUnique({ where: { id, organizationId } });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (existing.status === 'PAID') {
    return NextResponse.json({ error: 'Cannot delete a paid invoice.' }, { status: 400 });
  }

  // Soft cancel for sent invoices, hard delete for drafts
  if (existing.status === 'DRAFT') {
    await prisma.invoice.delete({ where: { id } });
    return NextResponse.json({ deleted: true });
  } else {
    await prisma.invoice.update({ where: { id }, data: { status: 'CANCELLED' } });
    return NextResponse.json({ cancelled: true });
  }
}
