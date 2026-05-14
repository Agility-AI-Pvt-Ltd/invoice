"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS: { href: string; label: string }[] = [
  { href: "/dashboard/expenses", label: "Overview" },
  { href: "/dashboard/expenses/income", label: "Income" },
  { href: "/dashboard/expenses/spending", label: "Expenses" },
  { href: "/dashboard/expenses/budget", label: "Budget" },
  { href: "/dashboard/expenses/analytics", label: "Reports" },
  { href: "/dashboard/expenses/compliance", label: "Tax & compliance" },
  { href: "/dashboard/expenses/approvals", label: "Approvals" },
  { href: "/dashboard/expenses/receipts", label: "Receipts" },
  { href: "/dashboard/expenses/currency", label: "Multi-currency" },
];

export default function ExpensesModuleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 p-8">
      <header className="space-y-2">
        <h1 className="heading-display text-4xl font-bold tracking-tight text-foreground">
          Business expenses tracker
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          At-a-glance financial health, categorized flows, budgets, compliance,
          and approvals — aligned with your workspace theme.
        </p>
      </header>

      <nav
        className="-mx-1 flex gap-1 overflow-x-auto pb-1"
        aria-label="Expenses sections"
      >
        {TABS.map(({ href, label }) => {
          const active =
            href === "/dashboard/expenses"
              ? pathname === href
              : pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
                active
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                  : "bg-muted/80 text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="animate-in fade-in duration-300">{children}</div>
    </div>
  );
}
