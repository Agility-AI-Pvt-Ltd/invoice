'use server';

import { prisma } from '@repo/db';
import { redirect } from 'next/navigation';
import { getSession } from '../../lib/auth';

export async function completeOnboarding(formData: FormData) {
  const user = await getSession();
  if (!user) return { error: 'Not authenticated' };

  const orgName = formData.get('orgName') as string;
  const stateCode = formData.get('stateCode') as string;
  const gstin = formData.get('gstin') as string;
  const address = formData.get('address') as string;
  
  if (!orgName || !stateCode) {
    return { error: 'Company Name and State Code are required' };
  }
  
  // Create organization
  const slug = orgName.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.random().toString(36).substring(2, 6);
  
  await prisma.organization.create({
    data: {
      name: orgName,
      slug,
      stateCode,
      gstin,
      address,
      ownerId: user.id
    }
  });
  
  // Mark user as onboarded
  await prisma.user.update({
    where: { id: user.id },
    data: { isOnboarded: true }
  });
  
  redirect('/');
}
