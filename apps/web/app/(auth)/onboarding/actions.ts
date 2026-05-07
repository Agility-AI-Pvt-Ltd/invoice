"use server";

import { z } from "zod";
import { prisma } from "@repo/db";
import { redirect } from "next/navigation";
import { getSession } from "../../../lib/auth";

const onboardingSchema = z.object({
  companyName: z
    .string()
    .min(2, { message: "Company Name must be at least 2 characters" }),
  gstin: z
    .string()
    .optional()
    .refine(
      (val) =>
        !val ||
        /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(val),
      { message: "Invalid GSTIN format" },
    ),
  stateCode: z
    .string()
    .min(1, { message: "State Code is required" })
    .max(2, { message: "Invalid State Code" }),
  address: z
    .string()
    .min(5, { message: "Address must be at least 5 characters" }),
});

type OnboardingState = {
  errors?: {
    companyName?: string[];
    gstin?: string[];
    stateCode?: string[];
    address?: string[];
  };
  message?: string;
} | null;

export async function onboardUser(
  _prevState: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const user = await getSession();

  if (!user) {
    redirect("/login");
  }

  const validatedFields = onboardingSchema.safeParse({
    companyName: formData.get("companyName"),
    gstin: (formData.get("gstin") as string) || undefined,
    stateCode: formData.get("stateCode"),
    address: formData.get("address"),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors as {
        companyName?: string[];
        gstin?: string[];
        stateCode?: string[];
        address?: string[];
      },
      message: "Please fix the errors below.",
    };
  }

  const { companyName, gstin, stateCode, address } = validatedFields.data;

  try {
    const slug =
      companyName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "") +
      "-" +
      Math.random().toString(36).substring(2, 6);

    await prisma.$transaction([
      prisma.organization.create({
        data: {
          name: companyName,
          slug,
          gstin,
          stateCode,
          address,
          ownerId: user.id,
        },
      }),
      prisma.user.update({
        where: { id: user.id },
        data: { isOnboarded: true },
      }),
    ]);
  } catch {
    return {
      message: "An error occurred during onboarding. Please try again.",
    };
  }

  redirect("/dashboard");
}
