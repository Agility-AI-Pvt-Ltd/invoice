import { cookies, headers } from "next/headers";
import { prisma } from "@repo/db";
import { redirect } from "next/navigation";
import { ApiErrors } from "./errors";
import { Organization, User } from "@repo/db";
import { getMcpBearerToken, verifyMcpBackendToken } from "./mcp-auth";

/**
 * Extended User type to include owned organizations.
 */
export type UserWithOrgs = User & {
  ownedOrgs: Pick<Organization, "id" | "stateCode" | "name">[];
};

const ORG_SELECT = {
  id: true,
  stateCode: true,
  name: true,
} as const;

async function getAuthIdentity() {
  const cookieStore = await cookies();
  const cookieUserId = cookieStore.get("userId")?.value;
  if (cookieUserId) return { userId: cookieUserId, organizationId: null };

  const headerStore = await headers();
  const token = getMcpBearerToken(headerStore);
  if (!token) return null;

  const claims = verifyMcpBackendToken(token);
  if (!claims) return null;

  return { userId: claims.sub, organizationId: claims.orgId };
}

const USER_SELECT = {
  id: true,
  email: true,
  name: true,
  image: true,
  isOnboarded: true,
  createdAt: true,
  updatedAt: true,
  ownedOrgs: {
    select: ORG_SELECT,
  },
} as const;

/**
 * Fetches the current session user. Returns null if not authenticated.
 */
export async function getSession(): Promise<UserWithOrgs | null> {
  const identity = await getAuthIdentity();
  if (!identity) return null;
  
  const user = await prisma.user.findUnique({
    where: { id: identity.userId },
    select: identity.organizationId
      ? {
          ...USER_SELECT,
          ownedOrgs: {
            where: { id: identity.organizationId },
            select: ORG_SELECT,
          },
        }
      : USER_SELECT,
  });

  if (identity.organizationId && user?.ownedOrgs.length === 0) return null;
  return user as UserWithOrgs | null;
}

/**
 * Ensures the user is authenticated and onboarded. Redirects if not.
 */
export async function requireAuth(): Promise<UserWithOrgs> {
  const user = await getSession();

  if (!user) {
    redirect("/login");
    throw new Error("Redirecting to login");
  }
  
  if (!user.isOnboarded) {
    redirect("/onboarding");
    throw new Error("Redirecting to onboarding");
  }

  return user;
}

/**
 * API-specific helper that throws an error instead of redirecting.
 */
export async function getSessionOrThrow(): Promise<UserWithOrgs> {
  const user = await getSession();
  if (!user) throw ApiErrors.UNAUTHORIZED();
  return user;
}

/**
 * Validates and returns an organization that the user owns.
 */
export function getOrgOrThrow(user: UserWithOrgs, orgId?: string): Pick<Organization, "id" | "stateCode" | "name"> {
  const id = orgId || user.ownedOrgs?.[0]?.id;
  if (!id) throw ApiErrors.BAD_REQUEST("No organization selected");

  const org = user.ownedOrgs.find((o) => o.id === id);
  if (!org) throw ApiErrors.FORBIDDEN();

  return org;
}
