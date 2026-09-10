"use server";

import { z } from "zod";
import { prisma } from "@repo/db";
import { hash } from "bcryptjs";
import { redirect } from "next/navigation";
import { cookies, headers } from "next/headers";
import { checkAuthRateLimit } from "../../../lib/ratelimit";
import { logger } from "@/lib/logger";

const registerSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Invalid email address" }),
  password: z
    .string()
    .min(12, { message: "Password must be at least 12 characters" })
    .refine(
      (pwd) => /[A-Z]/.test(pwd) && /[0-9]/.test(pwd) && /[!@#$%^&*()]/.test(pwd),
      { message: "Password must contain uppercase, number, and special character" }
    ),
});

type RegisterState = {
  errors?: {
    name?: string[];
    email?: string[];
    password?: string[];
  };
  message?: string;
} | null;

export async function registerUser(
  _prevState: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  const validatedFields = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors as {
        name?: string[];
        email?: string[];
        password?: string[];
      },
      message: "Please fix the errors below.",
    };
  }

  const { name, email, password } = validatedFields.data;

  const headerStore = await headers();
  const ip =
    headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anonymous";
  const rl = await checkAuthRateLimit(`register:${ip}`);
  if (!rl.allowed) {
    return {
      message: `Too many registration attempts. Try again in ${rl.retryAfter}s.`,
    };
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      return { message: "An account with this email already exists." };
    }

    const hashedPassword = await hash(password, 10);

    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword, isOnboarded: false },
    });

    const cookieStore = await cookies();
    cookieStore.set("userId", user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });
  } catch (error) {
    logger.error("auth:register", "Registration failed", error, { email });
    return {
      message: "An error occurred during registration. Please try again.",
    };
  }

  redirect("/onboarding");
}
