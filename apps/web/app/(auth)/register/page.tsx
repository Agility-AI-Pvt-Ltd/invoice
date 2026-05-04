import Link from "next/link";
import { RegisterForm } from "./register-form";

export default function RegisterPage() {
  return (
    <div className="animate-in flex flex-col space-y-8">
      <div className="flex flex-col space-y-2 text-center md:text-left">
        <h1 className="text-3xl font-bold tracking-tight heading-display">Create an account</h1>
        <p className="text-muted-foreground">
          Enter your details below to create your account and get started.
        </p>
      </div>
      <RegisterForm />
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-primary underline underline-offset-4 hover:text-primary/80 transition-colors">
          Sign in
        </Link>
      </p>
    </div>
  );
}
