import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { getSession } from "@/lib/auth";
import { computeExpenseBudgetRows } from "@/lib/expenses/summary";

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

    const deleted = await prisma.expenseBudget.deleteMany({
      where: { id, organizationId },
    });

    if (deleted.count === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const rows = await computeExpenseBudgetRows(organizationId);
    return NextResponse.json({ budgets: rows });
  } catch (e) {
    console.error("[expenses/budgets/:id DELETE]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
