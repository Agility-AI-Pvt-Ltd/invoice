import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { computeExpenseSummary } from "@/lib/expenses/summary";

export async function GET() {
  try {
    const user = await getSession();
    const organizationId = user?.ownedOrgs?.[0]?.id;
    if (!organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const summary = await computeExpenseSummary(organizationId);
    return NextResponse.json(summary);
  } catch (e) {
    console.error("[expenses/summary]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
