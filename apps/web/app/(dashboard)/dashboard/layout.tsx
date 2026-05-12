"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Users,
  Box,
  Settings,
  Repeat,
  Warehouse,
  BarChart2,
  ChevronRight,
  Wallet2,
} from "lucide-react";
import { ThemeToggle } from "../../../components/theme-toggle";
import { LogoutButton } from "./logout-button";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/dashboard/invoices", icon: FileText, label: "Invoices" },
  { href: "/dashboard/recurring", icon: Repeat, label: "Recurring" },
  { href: "/dashboard/customers", icon: Users, label: "Customers" },
  { href: "/dashboard/products", icon: Box, label: "Products" },
  { href: "/dashboard/inventory", icon: Warehouse, label: "Inventory" },
  { href: "/dashboard/expenses", icon: Wallet2, label: "Business expenses" },
  { href: "/dashboard/reports", icon: BarChart2, label: "Reports & GST" },
  { href: "/dashboard/settings", icon: Settings, label: "Settings" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen w-full bg-background text-foreground font-sans selection:bg-primary/20 selection:text-primary">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 bg-card border-r border-border flex flex-col transition-all duration-300 ease-in-out">
        {/* Logo */}
        <div className="h-20 flex items-center px-6 border-b border-border/50">
          <div className="flex items-center gap-2.5 group cursor-pointer">
            <div className="p-1.5 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors">
              <Image
                src="/assets/invoicely.png"
                alt=""
                width={28}
                height={28}
                className="rounded-lg object-contain shadow-sm"
              />
            </div>
            <span className="text-xl font-bold tracking-tight heading-display text-foreground">
              Agility <span className="text-primary">AI</span>
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-8 px-3 space-y-1.5">
          {navItems.map(({ href, icon: Icon, label }) => {
            const isActive =
              pathname === href ||
              (href !== "/dashboard" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center justify-between px-4 py-2.5 rounded-2xl text-sm font-medium transition-all duration-200 group ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02]"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/80"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-transform group-hover:scale-110 ${isActive ? "text-primary-foreground" : "text-muted-foreground/70 group-hover:text-primary"}`}
                  />
                  {label}
                </div>
                {isActive && (
                  <ChevronRight className="w-3.5 h-3.5 opacity-50" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer with Theme Toggle */}
        <div className="p-4 border-t border-border/50 space-y-4">
          <div className="flex items-center justify-between px-3">
            <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-[0.15em]">
              Appearance
            </span>
            <ThemeToggle />
          </div>
          <div className="px-4 py-3.5 bg-primary/5 rounded-2xl border border-primary/10">
            <p className="text-[10px] text-primary/70 text-center font-bold uppercase tracking-[0.25em]">
              Professional Edition
            </p>
          </div>
        </div>
      </aside>

      {/* Main content area */}
      <main className="flex-1 overflow-y-auto bg-background/30 custom-scrollbar">
        <LogoutButton />
        <div className="min-h-full animate-in">{children}</div>
      </main>
    </div>
  );
}
