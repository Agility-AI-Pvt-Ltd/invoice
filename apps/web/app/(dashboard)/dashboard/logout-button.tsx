"use client";

import { logoutUser } from "./actions";
import { LogOut } from "lucide-react";
import { useTransition } from "react";

export function LogoutButton() {
  const [isPending, startTransition] = useTransition();

  function handleLogout() {
    startTransition(async () => {
      await logoutUser();
    });
  }

  return (
    <button
      onClick={handleLogout}
      disabled={isPending}
      title="Logout"
      className="
        fixed top-4 right-4 z-50
        flex items-center gap-2
        px-3 py-2 rounded-xl
        bg-card/80 backdrop-blur-md
        border border-border/60
        text-sm font-medium text-muted-foreground
        shadow-lg shadow-black/5
        hover:text-destructive hover:border-destructive/40 hover:bg-destructive/5
        disabled:opacity-50 disabled:pointer-events-none
        transition-all duration-200 ease-in-out
        hover:shadow-destructive/10
        group
      "
    >
      <LogOut className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
      <span className="hidden sm:inline">
        {isPending ? "Logging out…" : "Logout"}
      </span>
    </button>
  );
}
