"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Terminal, Shield, Lock, AlertCircle, ArrowRight, UserCheck } from "lucide-react";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (res?.error) {
        if (res.error.includes("awaiting admin approval")) {
          setError("Your account is awaiting admin approval. Please contact a system administrator.");
        } else if (res.error.includes("disabled")) {
          setError("Your account has been disabled. Please contact an administrator.");
        } else {
          setError("Authentication failed: Invalid security credentials or unauthorized access.");
        }
      } else {
        router.push("/");
        router.refresh();
      }
    } catch (err: any) {
      if (err?.message?.includes("awaiting admin approval")) {
        setError("Your account is awaiting admin approval.");
      } else if (err?.message?.includes("disabled")) {
        setError("Your account has been disabled. Please contact an administrator.");
      } else {
        setError("An error occurred during authentication.");
      }
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (role: "admin" | "analyst") => {
    if (role === "admin") {
      setEmail("admin@aeha.local");
      setPassword("AdminSecurePassword123!");
    } else {
      setEmail("analyst@aeha.local");
      setPassword("AnalystSecurePassword123!");
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center p-4 bg-background text-foreground transition-colors">
      {/* Top right Theme Toggle */}
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md space-y-6">
        {/* Brand header */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 border border-primary/30 text-primary mb-2 shadow-xs">
            <Terminal className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight font-mono text-foreground">AEHA CONSOLE</h1>
          <p className="text-xs text-muted-foreground">
            Autonomous Ethical Hacking Assistant & Intelligent Penetration Testing (ITA1405)
          </p>
        </div>

        {/* Security Warning Box */}
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-400 flex items-start gap-2.5">
          <Shield className="h-4 w-4 shrink-0 mt-0.5" />
          <span>
            Authorized access only. All authentication attempts and operations are cryptographically chained in immutable audit logs.
          </span>
        </div>

        {/* Form Card */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-xl backdrop-blur">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                Account Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@aeha.local"
                required
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-foreground">Access Password</label>
                <Link
                  href="/forgot-password"
                  className="text-[11px] text-primary hover:underline font-medium"
                >
                  Forgot password?
                </Link>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 transition-opacity shadow-xs"
            >
              {loading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <Lock className="h-4 w-4" />
                  <span>Authenticate to Console</span>
                  <ArrowRight className="h-4 w-4 ml-1" />
                </>
              )}
            </button>
          </form>

          {/* Registration link */}
          <div className="mt-4 text-center text-xs text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="font-semibold text-primary hover:underline">
              Register here
            </Link>
          </div>

          {/* Quick Seed Buttons for Demo Reviewers */}
          <div className="mt-6 border-t border-border pt-4">
            <div className="text-[11px] font-mono uppercase text-muted-foreground mb-2">Demo Quick-Fill:</div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => fillCredentials("admin")}
                className="flex items-center justify-center gap-1.5 rounded border border-border bg-muted/60 px-2 py-1.5 text-xs text-foreground hover:bg-muted transition-colors"
              >
                <UserCheck className="h-3.5 w-3.5 text-primary" />
                <span>Admin Role</span>
              </button>
              <button
                type="button"
                onClick={() => fillCredentials("analyst")}
                className="flex items-center justify-center gap-1.5 rounded border border-border bg-muted/60 px-2 py-1.5 text-xs text-foreground hover:bg-muted transition-colors"
              >
                <UserCheck className="h-3.5 w-3.5 text-cyan-500" />
                <span>Analyst Role</span>
              </button>
            </div>
          </div>
        </div>

        <div className="text-center font-mono text-[11px] text-muted-foreground">
          Google DeepMind Antigravity • Ethical Hacking Automation
        </div>
      </div>
    </div>
  );
}
