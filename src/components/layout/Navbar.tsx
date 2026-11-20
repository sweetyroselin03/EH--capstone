"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ShieldAlert,
  LayoutDashboard,
  Target,
  CheckCircle2,
  FileText,
  History,
  Settings,
  Users,
  LogOut,
  Terminal,
  User,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

interface UserProfile {
  name: string;
  email: string;
  role: "ADMIN" | "ANALYST" | "VIEWER" | string;
  status: string;
}

export function Navbar() {
  const pathname = usePathname();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  // Hide Navbar completely on authentication / onboarding screens
  const isAuthScreen =
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password") ||
    pathname.startsWith("/invite");

  useEffect(() => {
    if (isAuthScreen) return;

    async function loadProfile() {
      try {
        const res = await fetch("/api/user/profile");
        const json = await res.json();
        if (json.success && json.user) {
          setProfile(json.user);
        }
      } catch (err) {
        console.warn("Could not load user profile:", err);
      }
    }
    loadProfile();
  }, [pathname, isAuthScreen]);

  if (isAuthScreen) {
    return null;
  }

  const role = profile?.role || "ADMIN";

  // Role-based navigation filtering
  const allNavLinks = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard, minRole: "VIEWER" },
    { href: "/assessments", label: "Assessments", icon: Target, minRole: "VIEWER" },
    { href: "/approvals", label: "Approvals", icon: CheckCircle2, minRole: "ANALYST" },
    { href: "/reports", label: "Reports", icon: FileText, minRole: "VIEWER" },
    { href: "/audit", label: "Audit Chain", icon: History, minRole: "VIEWER" },
    { href: "/settings", label: "Settings", icon: Settings, minRole: "ANALYST" },
    { href: "/admin/users", label: "Users", icon: Users, minRole: "ADMIN" },
  ];

  const visibleLinks = allNavLinks.filter((link) => {
    if (role === "ADMIN") return true;
    if (role === "ANALYST") return link.minRole === "VIEWER" || link.minRole === "ANALYST";
    // VIEWER role
    return link.minRole === "VIEWER";
  });

  return (
    <header className="sticky top-0 z-50 flex flex-col border-b border-border bg-background/90 backdrop-blur">
      {/* 1. Mandatory Persistent Security Banner */}
      <div className="flex items-center justify-between border-b border-amber-500/20 bg-amber-500/10 px-4 py-1 text-xs text-amber-600 dark:text-amber-400">
        <div className="flex items-center gap-2 font-mono">
          <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
          <span>
            <strong>AUTHORIZED TESTING ONLY:</strong> Explicit authorization & rules of engagement strictly enforced. All activities cryptographically hashed.
          </span>
        </div>
        <div className="hidden items-center gap-3 text-muted-foreground sm:flex">
          <span className="flex items-center gap-1.5 font-mono text-[11px]">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse"></span>
            SYS: ACTIVE
          </span>
          <span className="font-mono text-[11px]">AEHA v1.0 (ITA1405)</span>
        </div>
      </div>

      {/* 2. Main Navigation Bar */}
      <div className="flex h-14 items-center justify-between px-6">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 border border-primary/40 text-primary">
              <Terminal className="h-4.5 w-4.5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 font-bold tracking-tight text-foreground">
                <span>AEHA</span>
                <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-mono font-semibold text-primary border border-primary/20">
                  AI-PENTEST
                </span>
              </div>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {visibleLinks.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    isActive
                      ? "bg-secondary text-foreground border border-border"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User profile, theme toggle, and quick action */}
        <div className="flex items-center gap-3">
          {/* Theme Toggle (Light / Dark / System) */}
          <ThemeToggle />

          {/* New Assessment Wizard button (Hidden for VIEWER role) */}
          {role !== "VIEWER" && (
            <Link
              href="/assessments/new"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-xs hover:opacity-90 transition-opacity"
            >
              <span>+ New Assessment</span>
            </Link>
          )}

          {/* User profile & Logout */}
          <div className="flex items-center gap-2 border-l border-border pl-3">
            <Link
              href="/profile"
              className="text-right hidden sm:block hover:opacity-80 transition-opacity"
              title="View & Edit Profile"
            >
              <div className="text-xs font-medium text-foreground">
                {profile?.name || "Security Officer"}
              </div>
              <div className="text-[10px] font-mono font-semibold text-primary uppercase">
                ROLE: {role}
              </div>
            </Link>

            <Link
              href="/profile"
              title="Profile Settings"
              className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <User className="h-4 w-4" />
            </Link>

            <Link
              href="/login"
              title="Logout / Switch Account"
              className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/15 hover:text-destructive transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
