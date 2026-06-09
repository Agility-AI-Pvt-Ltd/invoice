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

const USER_BASE_SELECT = {
  id: true,
  email: true,
  name: true,
  image: true,
  isOnboarded: true,
  createdAt: true,
  updatedAt: true,
} as const;

/**
 * Fetches the current session user. Returns null if not authenticated.
 */
export async function getSession(): Promise<UserWithOrgs | null> {
  const identity = await getAuthIdentity();
  if (!identity) return null;
  const rawUserId = identity.userId;
  if (!rawUserId) {
    console.error("[auth] missing userId in identity", { identity });
    return null;
  }

  const userId = typeof rawUserId === "string" ? rawUserId : String(rawUserId);

  let userBase = null;
  try {
    userBase = await prisma.user.findUnique({
      where: { id: userId },
      select: USER_BASE_SELECT,
    });
  } catch (err) {
    const errStr = err instanceof Error ? err.stack || err.message : String(err);
    console.error("[auth] prisma.user.findUnique failed (attempt 1)", {
      identity,
      userId,
      where: { id: userId },
      err: errStr,
    });

    // For any DB error, log and return null so callers handle auth absence.
    try {
      if (String(errStr).includes("ETIMEDOUT")) {
        await new Promise((r) => setTimeout(r, 200));
        userBase = await prisma.user.findUnique({
          where: { id: userId },
          select: USER_BASE_SELECT,
        });
      } else {
        return null;
      }
    } catch (err2) {
      console.error("[auth] prisma.user.findUnique failed (retry)", {
        identity,
        userId,
        err: err2 instanceof Error ? err2.stack || err2.message : String(err2),
      });
      return null;
    }
  }
  if (!userBase) return null;

  let ownedOrgs = [] as Pick<Organization, "id" | "stateCode" | "name">[];
  try {
    ownedOrgs = identity.organizationId
      ? await prisma.organization.findMany({
          where: { id: identity.organizationId, ownerId: userBase.id },
          select: ORG_SELECT,
        })
      : await prisma.organization.findMany({
          where: { ownerId: userBase.id },
          select: ORG_SELECT,
        });
  } catch (err) {
    const errStr = err instanceof Error ? err.stack || err.message : String(err);
    console.error("[auth] prisma.organization.findMany failed", {
      identity,
      userId,
      err: errStr,
    });
    if (String(errStr).includes("ETIMEDOUT")) {
      // retry once
      try {
        await new Promise((r) => setTimeout(r, 200));
        ownedOrgs = identity.organizationId
          ? await prisma.organization.findMany({
              where: { id: identity.organizationId, ownerId: userBase.id },
              select: ORG_SELECT,
            })
          : await prisma.organization.findMany({
              where: { ownerId: userBase.id },
              select: ORG_SELECT,
            });
      } catch (err2) {
        console.error("[auth] prisma.organization.findMany failed (retry)", {
          identity,
          userId,
          err: err2 instanceof Error ? err2.stack || err2.message : String(err2),
        });
        return null;
      }
    } else {
      return null;
    }
  }

  if (identity.organizationId && ownedOrgs.length === 0) return null;

  return { ...userBase, ownedOrgs } as UserWithOrgs;
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
