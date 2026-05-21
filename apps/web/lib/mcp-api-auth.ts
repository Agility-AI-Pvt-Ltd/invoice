import { prisma } from "@repo/db";
import { ApiErrors } from "./errors";
import { getMcpBearerToken, verifyMcpBackendToken } from "./mcp-auth";

export async function getMcpApiSessionOrThrow(headers: Headers) {
  const token = getMcpBearerToken(headers);
  if (!token) throw ApiErrors.UNAUTHORIZED();

  const claims = verifyMcpBackendToken(token);
  if (!claims) throw ApiErrors.UNAUTHORIZED();

  const [user, organization] = await Promise.all([
    prisma.user.findUnique({
      where: { id: claims.sub },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        isOnboarded: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.organization.findUnique({
      where: { id: claims.orgId },
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
        address: true,
        currency: true,
        gstin: true,
        stateCode: true,
        phone: true,
        website: true,
        bankName: true,
        bankAccount: true,
        bankIfsc: true,
        upiId: true,
        ownerId: true,
        defaultTemplate: true,
        invoicePrefix: true,
        defaultDueDays: true,
        whatsappNumber: true,
        inventoryTrackingEnabled: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
  ]);

  if (!user || !organization) throw ApiErrors.UNAUTHORIZED();
  if (organization.ownerId !== user.id) throw ApiErrors.FORBIDDEN();

  return { user, organization };
}
