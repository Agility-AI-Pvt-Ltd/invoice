import { cookies } from 'next/headers';
import { prisma } from '@repo/db';
import { redirect } from 'next/navigation';

export async function getSession() {
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value;
  
  if (!userId) return null;
  
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      ownedOrgs: true
    }
  });
  
  return user;
}

export async function requireAuth() {
  const user = await getSession();
  if (!user) {
    redirect('/login');
  }
  
  if (!user.isOnboarded) {
    redirect('/onboarding');
  }
  
  return user;
}
