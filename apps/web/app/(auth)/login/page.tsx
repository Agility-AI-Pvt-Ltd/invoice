import Link from "next/link";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="animate-in flex flex-col space-y-8">
      <div className="flex flex-col space-y-2 text-center md:text-left">
        <h1 className="text-3xl font-bold tracking-tight heading-display">Welcome back</h1>
        <p className="text-muted-foreground">
          Enter your email to sign in to your account
        </p>
      </div>
      <LoginForm />
      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="font-medium text-primary underline underline-offset-4 hover:text-primary/80 transition-colors">
          Sign up
        </Link>
      </p>
    </div>
  );
}
