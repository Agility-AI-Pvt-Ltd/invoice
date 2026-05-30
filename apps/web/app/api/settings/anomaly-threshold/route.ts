import { NextRequest, NextResponse } from "next/server";
import { getSessionOrThrow, getOrgOrThrow } from "@/lib/auth";
import { prisma } from "@repo/db";

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionOrThrow();
    const org = getOrgOrThrow(user);

    const body = await req.json();
    let threshold: number | null = null;
    
    if (body.threshold !== undefined && body.threshold !== null) {
      threshold = Number(body.threshold);
      if (isNaN(threshold) || threshold < 0) {
        return NextResponse.json({ error: "Invalid threshold value" }, { status: 400 });
      }
    }

    const updatedOrg = await prisma.organization.update({
      where: { id: org.id },
      data: { customAnomalyThreshold: threshold }
    });

    return NextResponse.json({ success: true, customAnomalyThreshold: updatedOrg.customAnomalyThreshold });
  } catch (error: any) {
    console.error("Error setting custom anomaly threshold:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
