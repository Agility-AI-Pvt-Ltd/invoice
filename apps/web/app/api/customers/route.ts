import { NextResponse } from 'next/server';
import { prisma } from '@repo/db';
import { getSession } from '../../../lib/auth';

export async function POST(request: Request) {
  try {
    const user = await getSession();
    if (!user || !user.ownedOrgs || user.ownedOrgs.length === 0) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const organizationId = user.ownedOrgs[0].id;
    const body = await request.json();
    const { name, email, phone, gstin, stateCode, address, isRegistered } = body;

    if (!name || !stateCode) {
      return NextResponse.json({ error: 'Name and state code are required' }, { status: 400 });
    }

    const customer = await prisma.customer.create({
      data: {
        organizationId,
        name,
        email: email || null,
        phone: phone || null,
        gstin: gstin || null,
        stateCode,
        address: address || null,
        isRegistered: !!isRegistered,
      },
      select: { id: true, name: true, stateCode: true },
    });

    return NextResponse.json(customer, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 });
  }
}
