"use client";

import { useTheme } from "next-themes";
import { Moon, Sun, Monitor, Laptop } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return <div className="w-8 h-8" />;

  const themes = [
    { name: 'light', icon: Sun, label: 'Light' },
    { name: 'dark', icon: Moon, label: 'Dark' },
    { name: 'midnight', icon: Laptop, label: 'Midnight' },
  ];

  return (
    <div className="flex items-center gap-1 p-1 bg-secondary rounded-lg border border-border">
      {themes.map((t) => {
        const Icon = t.icon;
        const isActive = theme === t.name;
        return (
          <button
            key={t.name}
            onClick={() => setTheme(t.name)}
            title={t.label}
            className={`p-1.5 rounded-md transition-all ${
              isActive 
                ? "bg-card text-primary shadow-sm" 
                : "text-muted-foreground hover:text-foreground hover:bg-card/50"
            }`}
          >
            <Icon className="w-4 h-4" />
          </button>
        );
      })}
    </div>
  );
}
