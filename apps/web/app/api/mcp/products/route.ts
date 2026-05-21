import { Prisma, prisma } from "@repo/db";
import { handleApiError } from "@/lib/errors";
import { getMcpApiSessionOrThrow } from "@/lib/mcp-api-auth";
import { NextResponse } from "next/server";

function boundedInteger(value: string | null, fallback: number, min: number, max: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(Math.trunc(parsed), min), max);
}

export async function GET(req: Request) {
  const context = "api:mcp:products:list";

  try {
    const { organization } = await getMcpApiSessionOrThrow(req.headers);
    const url = new URL(req.url);
    const search = url.searchParams.get("search") || url.searchParams.get("q");
    const categoryId = url.searchParams.get("categoryId");
    const limit = boundedInteger(url.searchParams.get("limit"), 50, 1, 100);
    const offset = boundedInteger(url.searchParams.get("offset"), 0, 0, 10_000);

    const where: Prisma.ProductWhereInput = {
      organizationId: organization.id,
    };

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { hsnCode: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
      ];
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        select: {
          id: true,
          name: true,
          description: true,
          productKind: true,
          price: true,
          hsnCode: true,
          taxRate: true,
          unit: true,
          sku: true,
          imageUrls: true,
          createdAt: true,
          updatedAt: true,
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.product.count({ where }),
    ]);

    return NextResponse.json({
      products,
      total,
      hasMore: offset + products.length < total,
    });
  } catch (error) {
    return handleApiError(error, context);
  }
}
