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
  BarChart2,
  ChevronRight
} from "lucide-react";
import { ThemeToggle } from "../../../components/theme-toggle";
import { LogoutButton } from "./logout-button";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/dashboard/invoices", icon: FileText, label: "Invoices" },
  { href: "/dashboard/recurring", icon: Repeat, label: "Recurring" },
  { href: "/dashboard/customers", icon: Users, label: "Customers" },
  { href: "/dashboard/products", icon: Box, label: "Products" },
  { href: "/dashboard/reports", icon: BarChart2, label: "Reports & GST" },
  { href: "/dashboard/settings", icon: Settings, label: "Settings" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen w-full bg-background text-foreground font-sans selection:bg-primary/20 selection:text-primary">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 bg-card border-r border-border flex flex-col transition-all duration-300 ease-in-out">
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-border">
          <div className="flex items-center gap-2">
            <Image src="/assets/invoicely.png" alt="" width={32} height={32} className="rounded-lg object-contain shadow-lg shadow-primary/20" />
            <span className="text-lg font-bold tracking-tight heading-display">
              Invoice<span className="text-primary">ly</span>
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-6 px-3 space-y-1">
          {navItems.map(({ href, icon: Icon, label }) => {
            const isActive = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/10" 
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-primary"}`} />
                  {label}
                </div>
                {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-50" />}
              </Link>
            );
          })}
        </nav>

        {/* Footer with Theme Toggle */}
        <div className="p-4 border-t border-border space-y-4">
          <div className="flex items-center justify-between px-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Appearance</span>
            <ThemeToggle />
          </div>
          <div className="px-2 py-3 bg-secondary/50 rounded-xl border border-border/50">
            <p className="text-[10px] text-muted-foreground text-center font-medium uppercase tracking-[0.2em]">
              Professional Edition
            </p>
          </div>
        </div>
      </aside>

      {/* Main content area */}
      <main className="flex-1 overflow-y-auto bg-background/50 backdrop-blur-3xl custom-scrollbar">
        <LogoutButton />
        <div className="min-h-full animate-in">
          {children}
        </div>
      </main>
    </div>
  );
}
