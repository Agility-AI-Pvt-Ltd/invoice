import { cookies } from "next/headers";
import { prisma } from "@repo/db";
import { redirect } from "next/navigation";
import { ApiErrors, AppError } from "./errors";
import { Organization, User } from "@repo/db";

/**
 * Extended User type to include owned organizations.
 */
export type UserWithOrgs = User & {
  ownedOrgs: Pick<Organization, "id" | "stateCode" | "name">[];
};

async function getUserId() {
  const cookieStore = await cookies();
  return cookieStore.get("userId")?.value ?? null;
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
    select: {
      id: true,
      stateCode: true,
      name: true,
    },
  },
} as const;

/**
 * Fetches the current session user. Returns null if not authenticated.
 */
export async function getSession(): Promise<UserWithOrgs | null> {
  const userId = await getUserId();
  if (!userId) return null;
  
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: USER_SELECT,
  });

  return user as UserWithOrgs | null;
}

/**
 * Ensures the user is authenticated and onboarded. Redirects if not.
 */
export async function requireAuth(): Promise<UserWithOrgs> {
  const user = await getSession();

  if (!user) {
    redirect("/login");
  }
  
  if (!user.isOnboarded) {
    redirect("/onboarding");
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
