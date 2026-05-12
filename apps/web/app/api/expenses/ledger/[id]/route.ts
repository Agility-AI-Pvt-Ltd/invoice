import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { getSession } from "@/lib/auth";
import { ledgerPatchSchema } from "@/lib/expenses/schemas";

function parseOccurredAt(raw: string): Date | null {
  const d = raw.includes("T") ? new Date(raw) : new Date(`${raw}T12:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const user = await getSession();
    const organizationId = user?.ownedOrgs?.[0]?.id;
    if (!organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existing = await prisma.expenseLedgerEntry.findFirst({
      where: { id, organizationId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const json = await request.json();
    const parsed = ledgerPatchSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues.map((i) => i.message).join(", ") },
        { status: 400 },
      );
    }

    let occurredAt: Date | undefined;
    if (parsed.data.occurredAt !== undefined) {
      const d = parseOccurredAt(parsed.data.occurredAt);
      if (!d) {
        return NextResponse.json({ error: "Invalid occurredAt" }, { status: 400 });
      }
      occurredAt = d;
    }

    const row = await prisma.expenseLedgerEntry.update({
      where: { id },
      data: {
        ...(parsed.data.kind !== undefined ? { kind: parsed.data.kind } : {}),
        ...(parsed.data.category !== undefined
          ? { category: parsed.data.category.trim() }
          : {}),
        ...(parsed.data.amount !== undefined ? { amount: parsed.data.amount } : {}),
        ...(parsed.data.currency !== undefined ? { currency: parsed.data.currency } : {}),
        ...(occurredAt !== undefined ? { occurredAt } : {}),
        ...(parsed.data.description !== undefined
          ? { description: parsed.data.description?.trim() || null }
          : {}),
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
    console.error("[expenses/ledger/:id PATCH]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const user = await getSession();
    const organizationId = user?.ownedOrgs?.[0]?.id;
    if (!organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const deleted = await prisma.expenseLedgerEntry.deleteMany({
      where: { id, organizationId },
    });

    if (deleted.count === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[expenses/ledger/:id DELETE]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
