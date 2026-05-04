"use client";

import { useActionState } from "react";
import { sendPasswordReset } from "./actions";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [state, formAction, isPending] = useActionState(sendPasswordReset, null);

  return (
    <div className="animate-in flex flex-col space-y-8">
      <div className="flex flex-col space-y-2 text-center md:text-left">
        <h1 className="text-3xl font-bold tracking-tight heading-display">Forgot password?</h1>
        <p className="text-muted-foreground">
          Enter your email address and we&apos;ll send you a link to reset your password.
        </p>
      </div>

      {state?.success ? (
        <div className="p-4 bg-primary/10 border border-primary/20 text-primary rounded-xl text-sm text-center space-y-1">
          <p className="font-semibold">Check your inbox!</p>
          <p className="text-muted-foreground">
            If an account exists for that email, a reset link has been sent.
          </p>
        </div>
      ) : (
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="fp-email" className="text-sm font-medium leading-none">
              Email
            </label>
            <input
              id="fp-email"
              name="email"
              type="email"
              placeholder="m@example.com"
              required
              className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-shadow"
            />
            {state?.errors?.email && (
              <p className="text-sm text-destructive">{state.errors.email[0]}</p>
            )}
          </div>

          {state?.message && (
            <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">
              {state.message}
            </div>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 w-full mt-2 disabled:pointer-events-none disabled:opacity-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending link...
              </>
            ) : (
              "Send reset link"
            )}
          </button>
        </form>
      )}

      <Link
        href="/login"
        className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to sign in
      </Link>
    </div>
  );
}
