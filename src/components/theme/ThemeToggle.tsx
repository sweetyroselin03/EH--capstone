"use client";

import * as React from "react";
import { Moon, Sun, Laptop } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className={`flex items-center rounded-lg border border-border bg-card p-1 text-xs ${className}`}>
        <div className="h-6 w-6 rounded p-1 text-muted-foreground">
          <Sun className="h-4 w-4" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex items-center rounded-lg border border-border bg-card/80 p-0.5 text-xs shadow-sm backdrop-blur ${className}`}
      role="group"
      aria-label="Theme selector"
    >
      <button
        type="button"
        onClick={() => setTheme("light")}
        title="Light theme"
        className={`rounded p-1.5 transition-colors ${
          theme === "light"
            ? "bg-primary text-primary-foreground font-semibold shadow-xs"
            : "text-muted-foreground hover:text-foreground hover:bg-muted"
        }`}
        aria-pressed={theme === "light"}
      >
        <Sun className="h-3.5 w-3.5" />
        <span className="sr-only">Light</span>
      </button>

      <button
        type="button"
        onClick={() => setTheme("dark")}
        title="Dark theme"
        className={`rounded p-1.5 transition-colors ${
          theme === "dark"
            ? "bg-primary text-primary-foreground font-semibold shadow-xs"
            : "text-muted-foreground hover:text-foreground hover:bg-muted"
        }`}
        aria-pressed={theme === "dark"}
      >
        <Moon className="h-3.5 w-3.5" />
        <span className="sr-only">Dark</span>
      </button>

      <button
        type="button"
        onClick={() => setTheme("system")}
        title="System default theme"
        className={`rounded p-1.5 transition-colors ${
          theme === "system"
            ? "bg-primary text-primary-foreground font-semibold shadow-xs"
            : "text-muted-foreground hover:text-foreground hover:bg-muted"
        }`}
        aria-pressed={theme === "system"}
      >
        <Laptop className="h-3.5 w-3.5" />
        <span className="sr-only">System</span>
      </button>
    </div>
  );
}
