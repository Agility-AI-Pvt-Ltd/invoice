import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { Prisma } from "@prisma/client";
import { getOrgOrThrow, getSessionOrThrow } from "@/lib/auth";
import { computeExpenseSummary } from "@/lib/expenses/summary";
import {
  createExpenseLedgerEntry,
  currentUtcMonthRange,
  listExpenseLedgerEntries,
  summarizeEntriesByCategory,
} from "@/lib/expenses/ledger";
import { ledgerCreateSchema } from "@/lib/expenses/schemas";

// Basic security: require an MCP_SECRET_KEY to access these endpoints
const MCP_SECRET_KEY = process.env.MCP_SECRET_KEY || "dev-mcp-secret-key-123";
type McpActionPayload = Record<string, unknown>;

// Helper to verify auth
function isLegacySecret(req: Request) {
  const authHeader = req.headers.get("authorization");
  return authHeader === `Bearer ${MCP_SECRET_KEY}`;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      action?: string;
      organizationId?: string;
      payload?: unknown;
    };
    const { action, organizationId, payload } = body;
    let orgId = organizationId;

    if (!isLegacySecret(req)) {
      const user = await getSessionOrThrow();
      orgId = getOrgOrThrow(user).id;
    }

    if (!orgId) {
      return NextResponse.json({ error: "organizationId is required" }, { status: 400 });
    }

    switch (action) {
      case "get_financial_summary":
        return await getFinancialSummary(orgId);

      case "list_unpaid_invoices":
        return await listUnpaidInvoices(orgId);

      case "get_inventory_status":
        return await getInventoryStatus(orgId);

      case "create_quick_invoice":
        return await createQuickInvoice(orgId, payload);

      case "get_expense_summary":
        return await getExpenseTrackerSummary(orgId);

      case "list_ledger_entries":
      case "list_expense_ledger_entries":
        return await listLedgerEntriesTool(orgId, payload);

      case "add_ledger_entry":
      case "create_ledger_entry":
        return await createLedgerEntryTool(orgId, payload);

      case "add_income":
      case "log_income":
        return await createLedgerEntryTool(orgId, {
          ...normalizeMcpPayload(payload),
          kind: "INCOME",
        });

      case "add_expense":
      case "log_expense":
        return await createLedgerEntryTool(orgId, {
          ...normalizeMcpPayload(payload),
          kind: "EXPENSE",
        });

      case "get_income_by_category":
        return await getLedgerKindByCategoryTool(orgId, "INCOME", payload);

      case "get_expenses_by_category":
      case "get_spending_by_category":
        return await getLedgerKindByCategoryTool(orgId, "EXPENSE", payload);

      default:
        return NextResponse.json({ error: `Unknown MCP action: ${action}` }, { status: 400 });
    }
  } catch (error) {
    const status =
      error && typeof error === "object" && "status" in error
        ? error.status
        : undefined;
    const message = error instanceof Error ? error.message : "Internal server error";

    if (message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized access to MCP API" }, { status: 401 });
    }
    if (typeof status === "number") {
      return NextResponse.json({ error: message }, { status });
    }
    console.error("[MCP_API_ERROR]", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ----------------------------------------------------------------------
// MCP TOOL IMPLEMENTATIONS
// ----------------------------------------------------------------------

function numberFromPayload(value: unknown) {
  if (value === null || value === undefined || value === "") return undefined;
  return Number(value);
}

function normalizeMcpPayload(payload: unknown): McpActionPayload {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return {};
  return payload as McpActionPayload;
}

async function getExpenseTrackerSummary(orgId: string) {
  const summary = await computeExpenseSummary(orgId);
  return NextResponse.json({ summary });
}

async function listLedgerEntriesTool(orgId: string, rawPayload: unknown = {}) {
  const payload = normalizeMcpPayload(rawPayload);
  let result;
  try {
    result = await listExpenseLedgerEntries(orgId, {
      from: typeof payload.from === "string" ? payload.from : undefined,
      to: typeof payload.to === "string" ? payload.to : undefined,
      kind: typeof payload.kind === "string" ? payload.kind : undefined,
      limit: numberFromPayload(payload.limit),
      offset: numberFromPayload(payload.offset),
    });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Invalid ")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }

  return NextResponse.json(result);
}

async function createLedgerEntryTool(orgId: string, payload: unknown = {}) {
  const parsed = ledgerCreateSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map((issue) => issue.message).join(", ") },
      { status: 400 },
    );
  }

  let entry;
  try {
    entry = await createExpenseLedgerEntry(orgId, parsed.data);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Invalid ")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }

  return NextResponse.json({
    success: true,
    message: `${entry.kind === "INCOME" ? "Income" : "Expense"} ledger entry added.`,
    entry,
  });
}

async function getLedgerKindByCategoryTool(
  orgId: string,
  kind: "INCOME" | "EXPENSE",
  rawPayload: unknown = {},
) {
  const payload = normalizeMcpPayload(rawPayload);
  const monthRange = currentUtcMonthRange();
  const from =
    typeof payload.from === "string" ? payload.from : monthRange.from.toISOString();
  const to =
    typeof payload.to === "string"
      ? payload.to
      : new Date(monthRange.to.getTime() - 1).toISOString();
  let result;
  try {
    result = await listExpenseLedgerEntries(orgId, {
      from,
      to,
      kind,
      limit: numberFromPayload(payload.limit),
      offset: numberFromPayload(payload.offset),
    });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Invalid ")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }

  return NextResponse.json({
    kind,
    from,
    to,
    categories: summarizeEntriesByCategory(result.entries),
    entries: result.entries,
    total: result.total,
    hasMore: result.hasMore,
  });
}

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

    let subTotal = 0;
    const invoiceItems = items.map((i: any) => {
      const qty = Number(i.quantity) || 1;
      const price = Number(i.unitPrice) || 0;
      const total = Math.round(qty * price);
      subTotal += total;
      
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
