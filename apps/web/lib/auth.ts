import { cookies } from 'next/headers';
import { prisma } from '@repo/db';
import { redirect } from 'next/navigation';

async function getUserId() {
  const cookieStore = await cookies();
  return cookieStore.get('userId')?.value ?? null;
}

export async function getSession() {
  const userId = await getUserId();
  if (!userId) return null;
  return prisma.user.findUnique({ where: { id: userId } });
}

export async function requireAuth() {
  const userId = await getUserId();
  if (!userId) redirect('/login');

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { ownedOrgs: true },
  });

  if (!user) redirect('/login');
  if (!user.isOnboarded) redirect('/onboarding');

  return user;
}
