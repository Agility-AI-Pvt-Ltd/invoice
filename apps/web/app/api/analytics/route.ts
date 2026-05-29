import { NextRequest, NextResponse } from "next/server";
import { getSessionOrThrow, getOrgOrThrow } from "@/lib/auth";
import { prisma } from "@repo/db";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionOrThrow();
    const org = getOrgOrThrow(user);

    const dbOrg = await prisma.organization.findUnique({
      where: { id: org.id },
      select: { customAnomalyThreshold: true }
    });

    const res = await fetch(`http://localhost:8000/api/analytics/${org.id}`);
    if (!res.ok) {
      return NextResponse.json({ error: "Analytics service failed" }, { status: res.status });
    }
    const data = await res.json();
    
    // Inject the custom threshold into the response
    data.customAnomalyThreshold = dbOrg?.customAnomalyThreshold ?? null;

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error calling analytics service:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
