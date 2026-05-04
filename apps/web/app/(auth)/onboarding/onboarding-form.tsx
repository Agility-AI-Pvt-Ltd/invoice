"use client";

import { useActionState } from "react";
import { onboardUser } from "./actions";
import { Loader2 } from "lucide-react";

export function OnboardingForm() {
  const [state, formAction, isPending] = useActionState(onboardUser, null);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="ob-companyName" className="text-sm font-medium leading-none">
          Company Name
        </label>
        <input
          id="ob-companyName"
          name="companyName"
          placeholder="Acme Corp"
          required
          className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-shadow"
        />
        {state?.errors?.companyName && (
          <p className="text-sm text-destructive">{state.errors.companyName[0]}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="ob-gstin" className="text-sm font-medium leading-none">
            GSTIN{" "}
            <span className="text-muted-foreground font-normal">(Optional)</span>
          </label>
          <input
            id="ob-gstin"
            name="gstin"
            placeholder="27AAAAA0000A1Z5"
            className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-shadow uppercase"
          />
          {state?.errors?.gstin && (
            <p className="text-sm text-destructive">{state.errors.gstin[0]}</p>
          )}
        </div>
        <div className="space-y-2">
          <label htmlFor="ob-stateCode" className="text-sm font-medium leading-none">
            State Code
          </label>
          <input
            id="ob-stateCode"
            name="stateCode"
            placeholder="27"
            required
            className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-shadow"
          />
          {state?.errors?.stateCode && (
            <p className="text-sm text-destructive">{state.errors.stateCode[0]}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="ob-address" className="text-sm font-medium leading-none">
          Address
        </label>
        <textarea
          id="ob-address"
          name="address"
          placeholder="123 Business Street..."
          required
          rows={3}
          className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-shadow resize-none"
        />
        {state?.errors?.address && (
          <p className="text-sm text-destructive">{state.errors.address[0]}</p>
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
        className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 w-full mt-4 disabled:pointer-events-none disabled:opacity-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving details...
          </>
        ) : (
          "Complete Setup"
        )}
      </button>
    </form>
  );
}
