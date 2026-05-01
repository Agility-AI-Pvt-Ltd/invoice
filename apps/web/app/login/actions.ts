'use server';

import { cookies } from 'next/headers';
import { prisma } from '@repo/db';
import { redirect } from 'next/navigation';

export async function loginOrRegister(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  
  if (!email || !password) {
    return { error: 'Email and password are required' };
  }
  
  let user = await prisma.user.findUnique({ where: { email } });
  
  if (!user) {
    // Register
    user = await prisma.user.create({
      data: {
        email,
        password // In a real app, hash this!
      }
    });
  } else {
    // Login check
    if (user.password !== password) {
      return { error: 'Invalid password' };
    }
  }
  
  const cookieStore = await cookies();
  cookieStore.set('userId', user.id, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });
  
  redirect('/onboarding');
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete('userId');
  redirect('/login');
}
