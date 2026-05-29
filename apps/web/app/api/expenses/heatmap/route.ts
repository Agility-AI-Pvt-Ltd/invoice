import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@repo/db";

export async function GET(request: Request) {
  try {
    const user = await getSession();
    const organizationId = user?.ownedOrgs?.[0]?.id;
    if (!organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const yearStr = url.searchParams.get("year");
    const year = yearStr ? Number(yearStr) : new Date().getUTCFullYear();

    const rangeStart = new Date(Date.UTC(year, 0, 1));
    const rangeEnd = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));

    const rows = await prisma.expenseLedgerEntry.findMany({
      where: {
        organizationId,
        kind: "EXPENSE",
        occurredAt: { gte: rangeStart, lte: rangeEnd },
      },
      select: { amount: true, occurredAt: true },
    });

    // Aggregate by UTC date string (YYYY-MM-DD)
    const daily = new Map<string, number>();
    for (const row of rows) {
      const d = new Date(row.occurredAt);
      const dateStr = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
      daily.set(dateStr, (daily.get(dateStr) ?? 0) + Number(row.amount));
    }

    const result = [...daily.entries()].map(([date, amount]) => ({
      date,
      amount,
    }));

    return NextResponse.json({ year, days: result });
  } catch (e) {
    console.error("[expenses/heatmap]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
