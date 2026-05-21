import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { handleApiError } from "@/lib/errors";
import { getMcpApiSessionOrThrow } from "@/lib/mcp-api-auth";

export async function GET(req: Request) {
  const context = "api:mcp:me";

  try {
    const session = await getMcpApiSessionOrThrow(req.headers);
    const organization = await prisma.organization.findUnique({
      where: { id: session.organization.id },
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
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
      },
      organization,
    });
  } catch (error) {
    return handleApiError(error, context);
  }
}
