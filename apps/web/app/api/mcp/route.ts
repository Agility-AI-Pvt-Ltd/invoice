import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { Prisma } from "@prisma/client";

// Basic security: require an MCP_SECRET_KEY to access these endpoints
const MCP_SECRET_KEY = process.env.MCP_SECRET_KEY || "dev-mcp-secret-key-123";

// Helper to verify auth
function authenticate(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || authHeader !== `Bearer ${MCP_SECRET_KEY}`) {
    throw new Error("UNAUTHORIZED");
  }
}

export async function POST(req: Request) {
  try {
    authenticate(req);

    const body = await req.json();
    const { action, organizationId, payload } = body;

    if (!organizationId) {
      return NextResponse.json({ error: "organizationId is required" }, { status: 400 });
    }

    switch (action) {
      case "get_financial_summary":
        return await getFinancialSummary(organizationId);

      case "list_unpaid_invoices":
        return await listUnpaidInvoices(organizationId);

      case "get_inventory_status":
        return await getInventoryStatus(organizationId);

      case "create_quick_invoice":
        return await createQuickInvoice(organizationId, payload);

      default:
        return NextResponse.json({ error: `Unknown MCP action: ${action}` }, { status: 400 });
    }
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized access to MCP API" }, { status: 401 });
    }
    console.error("[MCP_API_ERROR]", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

// ----------------------------------------------------------------------
// MCP TOOL IMPLEMENTATIONS
// ----------------------------------------------------------------------

async function getFinancialSummary(orgId: string) {
  const invoices = await prisma.invoice.findMany({
    where: { organizationId: orgId },
    select: { status: true, total: true },
  });

  let totalRevenue = new Prisma.Decimal(0);
  let outstandingBalance = new Prisma.Decimal(0);
  let overdueCount = 0;

  for (const inv of invoices) {
    const amount = new Prisma.Decimal(inv.total as any);
    if (inv.status === "PAID") {
      totalRevenue = totalRevenue.plus(amount);
    } else if (inv.status === "SENT" || inv.status === "PARTIALLY_PAID") {
      outstandingBalance = outstandingBalance.plus(amount);
      overdueCount++; // Simplification: assuming all unpaid are actionable
    }
  }

  return NextResponse.json({
    totalRevenue: totalRevenue.toFixed(2),
    outstandingBalance: outstandingBalance.toFixed(2),
    actionableInvoices: overdueCount,
    currency: "INR",
  });
}

async function listUnpaidInvoices(orgId: string) {
  const unpaid = await prisma.invoice.findMany({
    where: { 
      organizationId: orgId,
      status: { in: ["SENT", "PARTIALLY_PAID"] }
    },
    include: { customer: true, payments: true },
    orderBy: { dueDate: 'asc' }
  });

  const formatted = unpaid.map(inv => {
    const paid = inv.payments.reduce((sum, p) => sum.plus(new Prisma.Decimal(p.amount as any)), new Prisma.Decimal(0));
    const total = new Prisma.Decimal(inv.total as any);
    const remaining = total.minus(paid);

    return {
      invoiceNumber: inv.invoiceNumber,
      customerName: inv.customer.name,
      dueDate: inv.dueDate.toISOString().split('T')[0],
      totalAmount: total.toFixed(2),
      remainingAmount: remaining.toFixed(2),
      status: inv.status
    };
  });

  return NextResponse.json({ unpaidInvoices: formatted });
}

async function getInventoryStatus(orgId: string) {
  const products = await prisma.product.findMany({
    where: { organizationId: orgId },
    select: { name: true, price: true },
    orderBy: { name: 'asc' }
  });

  return NextResponse.json({ inventory: products });
}

async function createQuickInvoice(orgId: string, payload: any) {
  const { customerName, items } = payload;
  
  if (!customerName || !items || !Array.isArray(items)) {
    throw new Error("Missing customerName or items in payload");
  }

  return await prisma.$transaction(async (tx) => {
    // Find or create customer
    let customer = await tx.customer.findFirst({
      where: { name: { equals: customerName, mode: "insensitive" }, organizationId: orgId }
    });

    if (!customer) {
      // Create a dummy customer so Claude doesn't get blocked
      customer = await tx.customer.create({
        data: {
          organizationId: orgId,
          name: customerName,
          stateCode: "00", // Placeholder
          isRegistered: false,
        }
      });
    }

    // Auto-generate invoice number
    const lastInvoice = await tx.invoice.findFirst({
      where: { organizationId: orgId },
      orderBy: { createdAt: 'desc' }
    });
    
    let nextNum = "INV-001";
    if (lastInvoice) {
      const match = lastInvoice.invoiceNumber.match(/(\d+)$/);
      if (match && match[1]) {
        const prefix = lastInvoice.invoiceNumber.replace(/\d+$/, "");
        nextNum = `${prefix}${String(parseInt(match[1], 10) + 1).padStart(3, '0')}`;
      }
    }

    let subTotal = new Prisma.Decimal(0);
    const invoiceItems = items.map((i: any) => {
      const qty = Number(i.quantity) || 1;
      const price = Number(i.unitPrice) || 0;
      const total = new Prisma.Decimal(qty * price);
      subTotal = subTotal.plus(total);
      
      return {
        description: i.description || "Service",
        quantity: qty,
        unitPrice: price,
        taxRate: 0,
        cgstAmount: 0,
        sgstAmount: 0,
        igstAmount: 0,
        total: total,
      };
    });

    const invoice = await tx.invoice.create({
      data: {
        organizationId: orgId,
        customerId: customer.id,
        invoiceNumber: nextNum,
        issueDate: new Date(),
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Due in 7 days
        subTotal,
        cgstTotal: 0,
        sgstTotal: 0,
        igstTotal: 0,
        total: subTotal,
        status: "DRAFT",
        placeOfSupply: "00",
        items: { create: invoiceItems }
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: `Invoice ${invoice.invoiceNumber} created successfully.`,
      invoiceId: invoice.id 
    });
  });
}
