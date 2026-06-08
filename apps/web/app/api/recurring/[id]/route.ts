import { NextResponse } from 'next/server';
import { prisma, Prisma } from '@repo/db';
import { getSession } from "@/lib/auth";
import { computeInvoiceTotals, validateItems } from "@/lib/gst";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getSession();
    const organizationId = user?.ownedOrgs?.[0]?.id;
    if (!organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const recurringInvoice = await prisma.recurringInvoice.findFirst({
      where: { id, organizationId },
      include: {
        items: true,
        customer: true,
        generatedInvoices: {
          select: { id: true, invoiceNumber: true, issueDate: true, total: true, status: true },
          orderBy: { issueDate: 'desc' },
          take: 10,
        },
      },
    });

    if (!recurringInvoice) {
      return NextResponse.json({ error: 'Recurring invoice not found' }, { status: 404 });
    }

    return NextResponse.json(recurringInvoice);
  } catch (error: any) {
    console.error('[recurring/:id/get]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getSession();
    const organizationId = user?.ownedOrgs?.[0]?.id;
    if (!organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      customerId: bodyCustomerId,
      title,
      interval,
      nextIssueDate,
      endDate,
      dueDays,
      autoSend,
      notes,
      items,
    } = body;

    const existing = await prisma.recurringInvoice.findFirst({
      where: { id, organizationId },
      include: { customer: true, organization: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Recurring invoice not found' }, { status: 404 });
    }

    let effectiveCustomer = existing.customer;
    if (bodyCustomerId !== undefined && bodyCustomerId !== existing.customerId) {
      const c = await prisma.customer.findFirst({
        where: { id: bodyCustomerId, organizationId },
      });
      if (!c) {
        return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
      }
      effectiveCustomer = c;
    }

    const resolvedCustomerId =
      bodyCustomerId !== undefined ? bodyCustomerId : existing.customerId;

    let subTotal = existing.subTotal;
    let cgstTotal = existing.cgstTotal;
    let sgstTotal = existing.sgstTotal;
    let igstTotal = existing.igstTotal;
    let total = existing.total;
    let processedItems:
      | {
          description: string;
          hsnCode: string | null;
          quantity: string;
          unitPrice: string;
          taxRate: Prisma.Decimal;
          cgstAmount: Prisma.Decimal;
          sgstAmount: Prisma.Decimal;
          igstAmount: Prisma.Decimal;
          total: Prisma.Decimal;
        }[]
      | undefined = undefined;

    if (items) {
      const itemError = validateItems(items);
      if (itemError) return NextResponse.json({ error: itemError }, { status: 400 });

      const orgState = existing.organization.stateCode;
      const custState = effectiveCustomer.stateCode;
      const isInterState =
        orgState != null && custState != null && orgState !== custState;
      const totals = computeInvoiceTotals(items, isInterState);
      subTotal = new Prisma.Decimal(totals.subTotal);
      cgstTotal = new Prisma.Decimal(totals.cgstTotal);
      sgstTotal = new Prisma.Decimal(totals.sgstTotal);
      igstTotal = new Prisma.Decimal(totals.igstTotal);
      total = new Prisma.Decimal(totals.grandTotal);
      processedItems = totals.processedItems.map((i) => ({
        description: i.description,
        hsnCode: i.hsnCode,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        taxRate: new Prisma.Decimal(i.taxRate),
        cgstAmount: new Prisma.Decimal(i.cgstAmount),
        sgstAmount: new Prisma.Decimal(i.sgstAmount),
        igstAmount: new Prisma.Decimal(i.igstAmount),
        total: new Prisma.Decimal(i.total),
      }));
    }

    const recurringInvoice = await prisma.$transaction(async (tx) => {
      if (items) {
        await tx.recurringInvoiceItem.deleteMany({ where: { recurringInvoiceId: id } });
      }

      return tx.recurringInvoice.update({
        where: { id },
        data: {
          customerId: resolvedCustomerId,
          title: title !== undefined ? title : existing.title,
          interval: interval || existing.interval,
          nextIssueDate: nextIssueDate ? new Date(nextIssueDate) : existing.nextIssueDate,
          endDate: endDate ? new Date(endDate) : existing.endDate,
          dueDays: dueDays !== undefined ? dueDays : existing.dueDays,
          autoSend: autoSend !== undefined ? autoSend : existing.autoSend,
          notes: notes !== undefined ? notes : existing.notes,
          subTotal,
          cgstTotal,
          sgstTotal,
          igstTotal,
          total,
          items: processedItems ? { create: processedItems } : undefined,
        },
        include: { items: true, customer: true },
      });
    });

    await prisma.activityLog.create({
      data: {
        organizationId,
        entity: 'RecurringInvoice',
        entityId: id,
        action: 'UPDATED',
        meta: { title, interval },
      },
    }).catch(() => {});

    return NextResponse.json(recurringInvoice);
  } catch (error: any) {
    console.error('[recurring/:id/update]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getSession();
    const organizationId = user?.ownedOrgs?.[0]?.id;
    if (!organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const recurring = await prisma.recurringInvoice.findFirst({
      where: { id, organizationId },
    });

    if (!recurring) {
      return NextResponse.json({ error: 'Recurring invoice not found' }, { status: 404 });
    }

    await prisma.recurringInvoice.delete({ where: { id } });

    await prisma.activityLog.create({
      data: {
        organizationId,
        entity: 'RecurringInvoice',
        entityId: id,
        action: 'DELETED',
        meta: {},
      },
    }).catch(() => {});

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[recurring/:id/delete]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
