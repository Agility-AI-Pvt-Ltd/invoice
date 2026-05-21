import { NextResponse } from 'next/server';
import { prisma } from '@repo/db';
import { getSession } from '../../../lib/auth';
import { computeInvoiceTotals, validateItems } from '../../../lib/gst';


export async function POST(request: Request) {
  try {
    const user = await getSession();
    const organization = user?.ownedOrgs?.[0];
    if (!organization) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      customerId,
      title,
      interval,
      nextIssueDate,
      endDate,
      dueDays,
      autoSend,
      notes,
      items,
    } = body;

    if (!customerId || !interval || !nextIssueDate || !items || items.length === 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!['WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY'].includes(interval)) {
      return NextResponse.json({ error: 'Invalid interval' }, { status: 400 });
    }

    if (endDate && new Date(endDate) < new Date(nextIssueDate)) {
      return NextResponse.json({ error: 'End date cannot be before next issue date' }, { status: 400 });
    }

    const itemError = validateItems(items);
    if (itemError) return NextResponse.json({ error: itemError }, { status: 400 });

    const customer = await prisma.customer.findFirst({
      where: { id: customerId, organizationId: organization.id },
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    const effectivePlaceOfSupply = customer.stateCode || organization.stateCode;
    if (!effectivePlaceOfSupply) {
      return NextResponse.json(
        { error: 'Customer or organization state code is required for GST calculation' },
        { status: 400 }
      );
    }

    const isInterState = !!organization.stateCode && organization.stateCode !== effectivePlaceOfSupply;
    const { subTotal, cgstTotal, sgstTotal, igstTotal, discountTotal, grandTotal, processedItems } =
      computeInvoiceTotals(items, isInterState);

    const recurringInvoice = await prisma.$transaction(async (tx) => {
      return tx.recurringInvoice.create({
        data: {
          organizationId: organization.id,
          customerId,
          title: title || null,
          interval,
          nextIssueDate: new Date(nextIssueDate),
          endDate: endDate ? new Date(endDate) : null,
          dueDays: dueDays || 30,
          autoSend: autoSend || false,
          notes: notes || null,
          subTotal,
          cgstTotal,
          sgstTotal,
          igstTotal,
          discountTotal,
          total: grandTotal,
          items: { create: processedItems.map(({ productId, ...rest }) => rest) },
        },
        include: { items: true, customer: true },
      });
    });

    await prisma.activityLog.create({
      data: {
        organizationId: organization.id,
        entity: 'RecurringInvoice',
        entityId: recurringInvoice.id,
        action: 'CREATED',
        meta: { title, interval, total: grandTotal },
      },
    }).catch(() => {});

    return NextResponse.json(recurringInvoice, { status: 201 });
  } catch (error: any) {
    console.error('[recurring/create]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const user = await getSession();
    const organizationId = user?.ownedOrgs?.[0]?.id;
    if (!organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const recurringInvoices = await prisma.recurringInvoice.findMany({
      where: { organizationId },
      include: { customer: true, items: true },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(recurringInvoices);
  } catch (error: any) {
    console.error('[recurring/list]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
