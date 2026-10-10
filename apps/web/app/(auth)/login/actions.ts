"use server";

import { z } from "zod";
import { prisma } from "@repo/db";
import { redirect } from "next/navigation";
import { cookies, headers } from "next/headers";
import { checkAuthRateLimit } from "../../../lib/ratelimit";
import { logger } from "@/lib/logger";
import { findUserByEmailForLogin } from "@/lib/find-user-by-email";
import {
  hashPassword,
  isBcryptHash,
  verifyPassword,
} from "@/lib/password";
import { databaseFailureMessage } from "@/lib/db-error";

const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(1, { message: "Password is required" }),
});

type LoginState = {
  errors?: {
    email?: string[];
    password?: string[];
  };
  message?: string;
} | null;

export async function loginUser(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const validatedFields = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors as {
        email?: string[];
        password?: string[];
      },
      message: "Please fix the errors below.",
    };
  }

  const email = validatedFields.data.email.trim().toLowerCase();
  const { password } = validatedFields.data;

  const headerStore = await headers();
  const ip =
    headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anonymous";
  const rl = await checkAuthRateLimit(`login:${ip}`);
  if (!rl.allowed) {
    return {
      message: `Too many login attempts. Try again in ${rl.retryAfter}s.`,
    };
  }

  let redirectPath = "/dashboard";

  try {
    const user = await findUserByEmailForLogin(email);

    if (!user?.password) {
      return { message: "Invalid email or password." };
    }

    const passwordMatch = await verifyPassword(password, user.password);

    if (!passwordMatch) {
      return { message: "Invalid email or password." };
    }

    if (!isBcryptHash(user.password)) {
      await prisma.user.update({
        where: { id: user.id },
        data: { password: await hashPassword(password) },
      });
    }

    const cookieStore = await cookies();
    cookieStore.set("userId", user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    if (!user.isOnboarded) {
      redirectPath = "/onboarding";
    }
  } catch (error) {
    logger.error("auth:login", "Unexpected login failure", error, { email });

    const message =
      databaseFailureMessage(error) ??
      "An error occurred during login. Please try again.";

    return { message };
  }

  redirect(redirectPath);
}
