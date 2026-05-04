import { getSession } from "../../../lib/auth";
import { redirect } from "next/navigation";
import { OnboardingForm } from "./onboarding-form";

export default async function OnboardingPage() {
  const user = await getSession();

  if (!user) {
    redirect("/login");
  }

  if (user.isOnboarded) {
    redirect("/dashboard");
  }

  return (
    <div className="animate-in flex flex-col space-y-8">
      <div className="flex flex-col space-y-2 text-center md:text-left">
        <h1 className="text-3xl font-bold tracking-tight heading-display">Welcome to Invoicely!</h1>
        <p className="text-muted-foreground text-base">
          Let&apos;s set up your business details so you can start creating GST invoices.
        </p>
      </div>
      <OnboardingForm />
    </div>
  );
}
