import { NextResponse } from 'next/server';
import { prisma } from '@repo/db';
import { getSession } from '../../../lib/auth';

// Helper to determine tax split
function calculateGST(amount: number, taxRate: number, isInterState: boolean) {
  const totalTaxAmount = (amount * taxRate) / 100;
  if (isInterState) {
    return { cgst: 0, sgst: 0, igst: totalTaxAmount };
  }
  return {
    cgst: totalTaxAmount / 2,
    sgst: totalTaxAmount / 2,
    igst: 0,
  };
}

export async function POST(request: Request) {
  try {
    const user = await getSession();
    if (!user || user.ownedOrgs.length === 0) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const organization = user.ownedOrgs[0];

    const body = await request.json();

    const { 
      invoiceNumber, 
      issueDate, 
      dueDate, 
      customerNameOrId, 
      customerStateCode,
      placeOfSupply,
      items // Array of { description, hsnCode, quantity, unitPrice, taxRate }
    } = body;

    // Validate required fields
    if (!invoiceNumber || !issueDate || !dueDate || !customerNameOrId || !items || items.length === 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Resolve Customer: try by ID first, then by exact name within org, then create
    let customer =
      (await prisma.customer.findFirst({
        where: { id: customerNameOrId, organizationId: organization.id }
      }).catch(() => null)) ??
      (await prisma.customer.findFirst({
        where: { name: customerNameOrId, organizationId: organization.id }
      }).catch(() => null));

    if (!customer) {
      // Brand new customer typed by hand
      customer = await prisma.customer.create({
        data: {
          organizationId: organization.id,
          name: customerNameOrId,
          stateCode: customerStateCode || organization.stateCode,
          isRegistered: false,
        }
      });
    }

    // Determine if it's an inter-state supply
    // If Place of Supply (or Customer State) is different from Organization State, it's Inter-State (IGST)
    const effectivePlaceOfSupply = placeOfSupply || customer.stateCode;
    const isInterState = organization.stateCode !== effectivePlaceOfSupply;

    // Calculate totals server-side (never trust client calculations)
    let subTotal = 0;
    let cgstTotal = 0;
    let sgstTotal = 0;
    let igstTotal = 0;

    const processedItems = items.map((item: any) => {
      const itemSubTotal = item.quantity * item.unitPrice;
      const taxes = calculateGST(itemSubTotal, item.taxRate || 0, isInterState);
      
      const itemTotal = itemSubTotal + taxes.cgst + taxes.sgst + taxes.igst;
      
      subTotal += itemSubTotal;
      cgstTotal += taxes.cgst;
      sgstTotal += taxes.sgst;
      igstTotal += taxes.igst;

      return {
        description: item.description,
        hsnCode: item.hsnCode,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxRate: item.taxRate || 0,
        cgstAmount: taxes.cgst,
        sgstAmount: taxes.sgst,
        igstAmount: taxes.igst,
        total: itemTotal,
      };
    });

    const grandTotal = subTotal + cgstTotal + sgstTotal + igstTotal;

    // Use Prisma Transaction to ensure Data Integrity
    const invoice = await prisma.$transaction(async (tx) => {
      // Auto-save any new products inline
      for (const item of items) {
        if (item.description) {
          const existingProduct = await tx.product.findFirst({
            where: { organizationId: organization.id, name: item.description }
          });
          if (!existingProduct) {
            await tx.product.create({
              data: {
                organizationId: organization.id,
                name: item.description,
                price: item.unitPrice,
                hsnCode: item.hsnCode,
                taxRate: item.taxRate || 0,
              }
            });
          }
        }
      }

      return await tx.invoice.create({
        data: {
          organizationId: organization.id,
          customerId: customer.id,
          invoiceNumber,
          issueDate: new Date(issueDate),
          dueDate: new Date(dueDate),
          placeOfSupply: effectivePlaceOfSupply,
          subTotal,
          cgstTotal,
          sgstTotal,
          igstTotal,
          total: grandTotal,
          status: 'DRAFT',
          items: {
            create: processedItems
          }
        },
        include: {
          items: true,
          customer: true
        }
      });
    });

    return NextResponse.json(invoice, { status: 201 });
  } catch (error: any) {
    console.error("Failed to create invoice:", error);
    // Unique constraint violation for invoiceNumber
    if (error.code === 'P2002') {
       return NextResponse.json({ error: 'Invoice number already exists.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
