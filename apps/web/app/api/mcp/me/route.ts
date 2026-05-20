import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { getOrgOrThrow, getSessionOrThrow } from "@/lib/auth";
import { handleApiError } from "@/lib/errors";

export async function GET() {
  const context = "api:mcp:me";

  try {
    const user = await getSessionOrThrow();
    const sessionOrg = getOrgOrThrow(user);
    const organization = await prisma.organization.findUnique({
      where: { id: sessionOrg.id },
      select: {
        id: true,
        name: true,
        slug: true,
        address: true,
        currency: true,
        gstin: true,
        stateCode: true,
        phone: true,
        website: true,
      },
    });

    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      organization,
    });
  } catch (error) {
    return handleApiError(error, context);
  }
}
