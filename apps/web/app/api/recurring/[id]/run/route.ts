import { NextResponse } from 'next/server';
import { prisma } from '@repo/db';
import { getSession } from "@/lib/auth";
import { generateNextInvoiceNumber } from "@/lib/invoice-utils";

export async function POST(
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
      include: { items: true, customer: true },
    });

    if (!recurring) {
      return NextResponse.json({ error: 'Recurring invoice not found' }, { status: 404 });
    }

    const invoice = await prisma.$transaction(async (tx) => {
      const lastInvoice = await tx.invoice.findFirst({
        where: { organizationId },
        orderBy: { createdAt: 'desc' },
      });

      const invoiceNumber = generateNextInvoiceNumber(lastInvoice?.invoiceNumber || null);
      const issueDate = new Date();
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + recurring.dueDays);

      const processedItems = recurring.items.map((item) => ({
        description: item.description,
        hsnCode: item.hsnCode,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxRate: item.taxRate,
        cgstAmount: item.cgstAmount,
        sgstAmount: item.sgstAmount,
        igstAmount: item.igstAmount,
        total: item.total,
      }));

      return tx.invoice.create({
        data: {
          organizationId,
          customerId: recurring.customerId,
          invoiceNumber,
          issueDate,
          dueDate,
          placeOfSupply: recurring.customer.stateCode,
          status: 'DRAFT',
          subTotal: recurring.subTotal,
          cgstTotal: recurring.cgstTotal,
          sgstTotal: recurring.sgstTotal,
          igstTotal: recurring.igstTotal,
          total: recurring.total,
          recurringInvoiceId: id,
          items: { create: processedItems },
        },
      });
    });

    await prisma.activityLog.create({
      data: {
        organizationId,
        entity: 'Invoice',
        entityId: invoice.id,
        action: 'CREATED_FROM_RECURRING',
        meta: { recurringId: id, invoiceNumber: invoice.invoiceNumber },
      },
    }).catch(() => {});

    return NextResponse.json({ id: invoice.id }, { status: 201 });
  } catch (error: any) {
    console.error('[recurring/:id/run]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
