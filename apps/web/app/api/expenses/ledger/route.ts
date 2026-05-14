import { NextResponse } from "next/server";
import type { Prisma } from "@repo/db";
import { prisma } from "@repo/db";
import { getSession } from "@/lib/auth";
import { ledgerCreateSchema } from "@/lib/expenses/schemas";

function parseOccurredAt(raw: string): Date | null {
  const d = raw.includes("T") ? new Date(raw) : new Date(`${raw}T12:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function GET(request: Request) {
  try {
    const user = await getSession();
    const organizationId = user?.ownedOrgs?.[0]?.id;
    if (!organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");
    const kind = url.searchParams.get("kind");

    const where: Prisma.ExpenseLedgerEntryWhereInput = {
      organizationId,
    };

    if (from || to) {
      const bounds: Prisma.DateTimeFilter = {};
      if (from) {
        const start = parseOccurredAt(from);
        if (!start) {
          return NextResponse.json({ error: "Invalid from date" }, { status: 400 });
        }
        bounds.gte = start;
      }
      if (to) {
        const end = parseOccurredAt(to);
        if (!end) {
          return NextResponse.json({ error: "Invalid to date" }, { status: 400 });
        }
        bounds.lte = end;
      }
      where.occurredAt = bounds;
    }

    if (kind === "INCOME" || kind === "EXPENSE") {
      where.kind = kind;
    }

    const rows = await prisma.expenseLedgerEntry.findMany({
      where,
      orderBy: { occurredAt: "desc" },
      take: 5000,
      select: {
        id: true,
        kind: true,
        category: true,
        amount: true,
        currency: true,
        occurredAt: true,
        description: true,
      },
    });

    return NextResponse.json({
      entries: rows.map((r) => ({
        ...r,
        amount: Number(r.amount),
        occurredAt: r.occurredAt.toISOString(),
      })),
    });
  } catch (e) {
    console.error("[expenses/ledger GET]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSession();
    const organizationId = user?.ownedOrgs?.[0]?.id;
    if (!organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const json = await request.json();
    const parsed = ledgerCreateSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues.map((i) => i.message).join(", ") },
        { status: 400 },
      );
    }

    const occurredAt = parseOccurredAt(parsed.data.occurredAt);
    if (!occurredAt) {
      return NextResponse.json({ error: "Invalid occurredAt" }, { status: 400 });
    }

    const row = await prisma.expenseLedgerEntry.create({
      data: {
        organizationId,
        kind: parsed.data.kind,
        category: parsed.data.category.trim(),
        amount: parsed.data.amount,
        currency: parsed.data.currency ?? "INR",
        occurredAt,
        description: parsed.data.description?.trim() || null,
      },
      select: {
        id: true,
        kind: true,
        category: true,
        amount: true,
        currency: true,
        occurredAt: true,
        description: true,
      },
    });

    return NextResponse.json({
      ...row,
      amount: Number(row.amount),
      occurredAt: row.occurredAt.toISOString(),
    });
  } catch (e) {
    console.error("[expenses/ledger POST]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
