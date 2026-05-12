import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { computeExpenseReport } from "@/lib/expenses/report";

export async function GET(request: Request) {
  try {
    const user = await getSession();
    const organizationId = user?.ownedOrgs?.[0]?.id;
    if (!organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const g = url.searchParams.get("granularity") ?? "quarterly";
    const granularity =
      g === "monthly" || g === "quarterly" || g === "annual"
        ? g
        : "quarterly";

    const periods = await computeExpenseReport(organizationId, granularity);
    return NextResponse.json({ granularity, periods });
  } catch (e) {
    console.error("[expenses/report]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
