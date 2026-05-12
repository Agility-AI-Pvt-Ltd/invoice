import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { getSession } from "@/lib/auth";
import { budgetUpsertSchema } from "@/lib/expenses/schemas";
import { computeExpenseBudgetRows } from "@/lib/expenses/summary";

export async function GET() {
  try {
    const user = await getSession();
    const organizationId = user?.ownedOrgs?.[0]?.id;
    if (!organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rows = await computeExpenseBudgetRows(organizationId);
    return NextResponse.json({ budgets: rows });
  } catch (e) {
    console.error("[expenses/budgets GET]", e);
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
    const parsed = budgetUpsertSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues.map((i) => i.message).join(", ") },
        { status: 400 },
      );
    }

    const category = parsed.data.category.trim();

    await prisma.expenseBudget.upsert({
      where: {
        organizationId_category: {
          organizationId,
          category,
        },
      },
      create: {
        organizationId,
        category,
        limitAmount: parsed.data.limitAmount,
        currency: parsed.data.currency ?? "INR",
      },
      update: {
        limitAmount: parsed.data.limitAmount,
        currency: parsed.data.currency ?? "INR",
      },
    });

    const rows = await computeExpenseBudgetRows(organizationId);
    return NextResponse.json({ budgets: rows });
  } catch (e) {
    console.error("[expenses/budgets POST]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
