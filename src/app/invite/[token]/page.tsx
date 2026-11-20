"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { Terminal, ShieldCheck, AlertCircle, CheckCircle2, ArrowRight, UserCheck } from "lucide-react";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

export default function AcceptInvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);

  const [inviteData, setInviteData] = useState<{ email: string; role: string } | null>(null);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function verifyInvite() {
      try {
        const res = await fetch(`/api/auth/invite?token=${token}`);
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error || "Invalid or expired invitation");
        }
        setInviteData({ email: json.email, role: json.role });
      } catch (err: any) {
        setError(err.message || "Failed to verify invitation link");
      } finally {
        setLoading(false);
      }
    }
    verifyInvite();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 10) {
      setError("Password must be at least 10 characters long.");
      return;
    }
    if (!/[0-9]/.test(password)) {
      setError("Password must contain at least one number.");
      return;
    }
    if (!/[^a-zA-Z0-9]/.test(password)) {
      setError("Password must contain at least one special symbol.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/auth/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          name: name.trim(),
          password,
          confirmPassword,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to activate invited account");
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center p-4 bg-background text-foreground transition-colors">
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 border border-primary/30 text-primary mb-2 shadow-xs">
            <UserCheck className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight font-mono text-foreground">
            ADMIN INVITATION ACCEPTANCE
          </h1>
          <p className="text-xs text-muted-foreground">
            Complete your onboarding to join the AEHA security operations workspace
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-xl backdrop-blur">
          {loading ? (
            <div className="py-8 text-center text-xs font-mono text-muted-foreground animate-pulse">
              Verifying cryptographic invitation token...
            </div>
          ) : error && !inviteData ? (
            <div className="space-y-4 text-center">
              <div className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-xs text-destructive">
                {error}
              </div>
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-1.5 text-xs text-primary hover:underline font-semibold"
              >
                Return to Login
              </Link>
            </div>
          ) : success ? (
            <div className="space-y-4 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <h2 className="text-base font-bold text-foreground">Account Activated!</h2>
              <p className="text-xs text-muted-foreground">
                Your credentials have been configured with pre-approved{" "}
                <span className="font-mono font-semibold text-primary">{inviteData?.role}</span> access. You can now log in immediately.
              </p>
              <div className="pt-2">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90 transition-opacity shadow-xs w-full"
                >
                  <span>Log in to AEHA Console</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="rounded-lg border border-border bg-muted/60 p-3 text-xs space-y-1">
                <div className="text-muted-foreground">Invited Email:</div>
                <div className="font-mono font-bold text-foreground">{inviteData?.email}</div>
                <div className="text-muted-foreground pt-1">Pre-authorized Role:</div>
                <div className="font-mono font-bold text-primary">{inviteData?.role} (Pre-approved)</div>
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Your Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Security Analyst Name"
                  required
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Create Access Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <div className="text-[10px] text-muted-foreground mt-1">
                  Min 10 chars, at least one number and one symbol.
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 transition-opacity shadow-xs"
              >
                {submitting ? (
                  <span>Activating Account...</span>
                ) : (
                  <>
                    <ShieldCheck className="h-4 w-4" />
                    <span>Activate Account & Join</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
