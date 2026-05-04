'use server';

import { cookies } from 'next/headers';
import { prisma } from '@repo/db';
import { redirect } from 'next/navigation';
import bcrypt from 'bcryptjs';

export async function loginOrRegister(_prevState: unknown, formData: FormData) {
  const email = (formData.get('email') as string)?.trim().toLowerCase();
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Email and password are required' };
  }

  if (password.length < 8) {
    return { error: 'Password must be at least 8 characters' };
  }

  let user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    // Register — hash before storing
    const hashedPassword = await bcrypt.hash(password, 12);
    user = await prisma.user.create({
      data: { email, password: hashedPassword }
    });
  } else {
    // Login — compare hash
    if (!user.password) {
      return { error: 'Invalid credentials' };
    }
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return { error: 'Invalid credentials' };
    }
  }

  const cookieStore = await cookies();
  cookieStore.set('userId', user.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });

  redirect('/onboarding');
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete('userId');
  redirect('/login');
}
