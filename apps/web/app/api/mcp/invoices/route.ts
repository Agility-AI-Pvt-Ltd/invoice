import { NextResponse } from "next/server";
import { InvoiceStatus, Prisma, prisma } from "@repo/db";
import { getOrgOrThrow, getSessionOrThrow } from "@/lib/auth";
import { handleApiError } from "@/lib/errors";

function boundedInteger(value: string | null, fallback: number, min: number, max: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(Math.trunc(parsed), min), max);
}

export async function GET(req: Request) {
  const context = "api:mcp:invoices:list";

  try {
    const user = await getSessionOrThrow();
    const organization = getOrgOrThrow(user);
    const url = new URL(req.url);
    const status = url.searchParams.get("status");
    const customerId = url.searchParams.get("customerId");
    const customerName = url.searchParams.get("customerName");
    const search = url.searchParams.get("search") || url.searchParams.get("q");
    const limit = boundedInteger(url.searchParams.get("limit"), 50, 1, 100);
    const offset = boundedInteger(url.searchParams.get("offset"), 0, 0, 10_000);

    const where: Prisma.InvoiceWhereInput = {
      organizationId: organization.id,
    };

    if (status && Object.values(InvoiceStatus).includes(status as InvoiceStatus)) {
      where.status = status as InvoiceStatus;
    }

    if (customerId) {
      where.customerId = customerId;
    }

    const customerFilters: Prisma.CustomerWhereInput[] = [];
    if (customerName) {
      customerFilters.push({
        name: { contains: customerName, mode: "insensitive" },
      });
    }
    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search, mode: "insensitive" } },
        { customer: { name: { contains: search, mode: "insensitive" } } },
      ];
    }
    if (customerFilters.length > 0) {
      where.customer = { AND: customerFilters };
    }

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              gstin: true,
              stateCode: true,
              address: true,
            },
          },
          items: true,
          payments: true,
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.invoice.count({ where }),
    ]);

    return NextResponse.json({
      invoices,
      total,
      hasMore: offset + invoices.length < total,
    });
  } catch (error) {
    return handleApiError(error, context);
  }
}
