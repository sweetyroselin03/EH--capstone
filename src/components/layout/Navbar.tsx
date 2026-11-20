"use client";

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
} from "lucide-react";

export function Navbar() {
  const pathname = usePathname();

  // Don't show standard navigation on login page
  if (pathname === "/login") {
    return null;
  }

  const navLinks = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/assessments", label: "Assessments", icon: Target },
    { href: "/approvals", label: "Approvals", icon: CheckCircle2 },
    { href: "/reports", label: "Reports", icon: FileText },
    { href: "/audit", label: "Audit Chain", icon: History },
    { href: "/settings", label: "Settings", icon: Settings },
    { href: "/admin/users", label: "Users", icon: Users },
  ];

  return (
    <header className="sticky top-0 z-50 flex flex-col border-b border-zinc-800 bg-zinc-950/90 backdrop-blur">
      {/* 1. Mandatory Persistent Security Banner */}
      <div className="flex items-center justify-between border-b border-amber-500/20 bg-amber-500/10 px-4 py-1 text-xs text-amber-400">
        <div className="flex items-center gap-2 font-mono">
          <ShieldAlert className="h-3.5 w-3.5 text-amber-400" />
          <span>
            <strong>AUTHORIZED TESTING ONLY:</strong> Explicit authorization & rules of engagement strictly enforced. All activities cryptographically hashed.
          </span>
        </div>
        <div className="hidden items-center gap-3 text-zinc-400 sm:flex">
          <span className="flex items-center gap-1.5 font-mono text-[11px]">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            SYS: ACTIVE
          </span>
          <span className="font-mono text-[11px] text-zinc-500">AEHA v1.0 (ITA1405)</span>
        </div>
      </div>

      {/* 2. Main Navigation Bar */}
      <div className="flex h-14 items-center justify-between px-6">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-400">
              <Terminal className="h-4.5 w-4.5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 font-bold tracking-tight text-zinc-100">
                <span>AEHA</span>
                <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-mono font-semibold text-emerald-400 border border-emerald-500/20">
                  AI-PENTEST
                </span>
              </div>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((item) => {
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
                      ? "bg-zinc-800 text-zinc-100 border border-zinc-700"
                      : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User profile & quick action */}
        <div className="flex items-center gap-3">
          <Link
            href="/assessments/new"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-emerald-500 transition-colors"
          >
            <span>+ New Assessment</span>
          </Link>

          <div className="flex items-center gap-2 border-l border-zinc-800 pl-3">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-medium text-zinc-200">Security Officer</div>
              <div className="text-[10px] font-mono text-emerald-400">ROLE: ADMIN</div>
            </div>
            <Link
              href="/login"
              title="Logout / Switch User"
              className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
