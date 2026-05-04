import { MailCheck, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function VerifyEmailPage() {
  return (
    <div className="animate-in flex flex-col items-center space-y-6 text-center">
      <div className="p-5 bg-primary/10 rounded-2xl">
        <MailCheck className="w-12 h-12 text-primary" />
      </div>

      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight heading-display">Check your email</h1>
        <p className="text-muted-foreground max-w-sm">
          We sent a verification link to your email address. Click the link in the email to
          verify your account.
        </p>
      </div>

      <div className="w-full p-4 bg-secondary/60 border border-border rounded-xl text-sm text-muted-foreground space-y-1">
        <p>Didn&apos;t receive an email?</p>
        <p>Check your spam folder or contact support.</p>
      </div>

      <Link
        href="/login"
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to sign in
      </Link>
    </div>
  );
}
