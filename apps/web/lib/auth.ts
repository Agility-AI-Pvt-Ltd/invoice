import { cookies } from 'next/headers';
import { prisma } from '@repo/db';
import { redirect } from 'next/navigation';

async function getUserId() {
  const cookieStore = await cookies();
  return cookieStore.get('userId')?.value ?? null;
}

/** Keep `ownedOrgs` fields minimal so auth queries stay valid before optional migrations (e.g. inventory columns). */
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
    },
  },
} as const;

export async function getSession() {
  const userId = await getUserId();
  if (!userId) return null;
  return prisma.user.findUnique({
    where: { id: userId },
    select: USER_SELECT,
  });
}

export async function requireAuth() {
  const userId = await getUserId();
  if (!userId) redirect('/login');

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: USER_SELECT,
  });

  if (!user) redirect('/login');
  if (!user.isOnboarded) redirect('/onboarding');

  return user;
}
