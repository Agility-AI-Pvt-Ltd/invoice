import { NextResponse } from 'next/server';
import { prisma } from '@repo/db';
import { getSession } from "@/lib/auth";

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
    });

    if (!recurring) {
      return NextResponse.json({ error: 'Recurring invoice not found' }, { status: 404 });
    }

    const updated = await prisma.recurringInvoice.update({
      where: { id },
      data: { active: !recurring.active },
    });

    await prisma.activityLog.create({
      data: {
        organizationId,
        entity: 'RecurringInvoice',
        entityId: id,
        action: updated.active ? 'RESUMED' : 'PAUSED',
        meta: {},
      },
    }).catch(() => {});

    return NextResponse.json({ active: updated.active });
  } catch (error: any) {
    console.error('[recurring/:id/toggle]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
