"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Terminal, Shield, Lock, AlertCircle, ArrowRight, UserCheck } from "lucide-react";

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
        setError("Authentication failed: Invalid security credentials or unauthorized access.");
      } else {
        router.push("/");
        router.refresh();
      }
    } catch {
      setError("An error occurred during authentication.");
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
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-zinc-950">
      <div className="w-full max-w-md space-y-6">
        {/* Brand header */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mb-2">
            <Terminal className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-mono">AEHA CONSOLE</h1>
          <p className="text-xs text-zinc-400">
            Autonomous Ethical Hacking Assistant & Intelligent Penetration Testing (ITA1405)
          </p>
        </div>

        {/* Security Warning Box */}
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-300 flex items-start gap-2.5">
          <Shield className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
          <span>
            Authorized access only. All authentication attempts and operations are cryptographically chained in immutable audit logs.
          </span>
        </div>

        {/* Form Card */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6 shadow-2xl backdrop-blur">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Analyst / Admin Email</label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@aeha.local"
                  required
                  className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Access Password</label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 disabled:opacity-50 transition-colors"
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

          {/* Quick Seed Buttons for Demo Reviewers */}
          <div className="mt-6 border-t border-zinc-800 pt-4">
            <div className="text-[11px] font-mono uppercase text-zinc-500 mb-2">Demo Quick-Fill:</div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => fillCredentials("admin")}
                className="flex items-center justify-center gap-1.5 rounded border border-zinc-700 bg-zinc-800/80 px-2 py-1.5 text-xs text-zinc-300 hover:bg-zinc-700 transition-colors"
              >
                <UserCheck className="h-3.5 w-3.5 text-emerald-400" />
                <span>Admin Role</span>
              </button>
              <button
                type="button"
                onClick={() => fillCredentials("analyst")}
                className="flex items-center justify-center gap-1.5 rounded border border-zinc-700 bg-zinc-800/80 px-2 py-1.5 text-xs text-zinc-300 hover:bg-zinc-700 transition-colors"
              >
                <UserCheck className="h-3.5 w-3.5 text-cyan-400" />
                <span>Analyst Role</span>
              </button>
            </div>
          </div>
        </div>

        <div className="text-center font-mono text-[11px] text-zinc-500">
          Google DeepMind Antigravity • Ethical Hacking Automation
        </div>
      </div>
    </div>
  );
}
