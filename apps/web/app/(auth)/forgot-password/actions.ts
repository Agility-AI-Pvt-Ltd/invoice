"use server";

import { z } from "zod";

const schema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
});

type ForgotPasswordState = {
  errors?: { email?: string[] };
  message?: string;
  success?: boolean;
} | null;

export async function sendPasswordReset(
  _prevState: ForgotPasswordState,
  formData: FormData,
): Promise<ForgotPasswordState> {
  const validatedFields = schema.safeParse({ email: formData.get("email") });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors as {
        email?: string[];
      },
    };
  }

  // In a real app, send an email here via Resend/Nodemailer.
  // We always return success to avoid leaking which emails are registered.
  return { success: true };
}
