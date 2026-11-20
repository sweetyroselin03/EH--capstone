"use client";

import { useEffect, useState } from "react";
import { User, Shield, Lock, Save, AlertCircle, CheckCircle2 } from "lucide-react";
import { formatStatus } from "@/lib/utils";

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Form fields
  const [name, setName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch("/api/user/profile");
        const json = await res.json();
        if (json.success && json.user) {
          setProfile(json.user);
          setName(json.user.name || "");
        }
      } catch (err) {
        console.error("Failed to load profile:", err);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPassword) {
      if (newPassword.length < 10) {
        setError("New password must be at least 10 characters long.");
        return;
      }
      if (!/[0-9]/.test(newPassword)) {
        setError("New password must contain at least one number.");
        return;
      }
      if (!/[^a-zA-Z0-9]/.test(newPassword)) {
        setError("New password must contain at least one symbol.");
        return;
      }
      if (newPassword !== confirmPassword) {
        setError("New passwords do not match.");
        return;
      }
      if (!currentPassword) {
        setError("Current password is required to change your password.");
        return;
      }
    }

    setSaving(true);

    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          currentPassword: currentPassword || undefined,
          newPassword: newPassword || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to update profile");
      }

      setSuccess("Profile settings successfully updated.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center p-6 text-xs font-mono text-muted-foreground animate-pulse">
        Loading user security credentials and profile...
      </div>
    );
  }

  const statusFmt = formatStatus(profile?.status || "ACTIVE");

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="border-b border-border pb-5">
        <h1 className="text-xl font-bold tracking-tight text-foreground font-mono flex items-center gap-2">
          <User className="h-5 w-5 text-primary" />
          <span>USER PROFILE & SECURITY SETTINGS</span>
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Review your assigned organizational role, manage identity details, and update security passphrases
        </p>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="rounded-md border border-emerald-500/40 bg-emerald-500/10 p-3 text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Role & Credential Card */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" />
          <span>Security Identity & Role-Based Access Control</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
          <div className="rounded-lg border border-border bg-muted/50 p-3">
            <div className="text-[10px] uppercase text-muted-foreground">Account Email</div>
            <div className="font-semibold text-foreground truncate mt-0.5">{profile?.email}</div>
          </div>

          <div className="rounded-lg border border-border bg-muted/50 p-3">
            <div className="text-[10px] uppercase text-muted-foreground">Assigned Role</div>
            <div className="font-bold text-primary text-sm mt-0.5">{profile?.role}</div>
          </div>

          <div className="rounded-lg border border-border bg-muted/50 p-3">
            <div className="text-[10px] uppercase text-muted-foreground">Account Status</div>
            <div className="mt-0.5">
              <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold ${statusFmt.class}`}>
                {statusFmt.label}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Update Settings Form */}
      <form onSubmit={handleUpdate} className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-5">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Identity & Name</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Your display name shown on assessment logs and audit chain events
          </p>
        </div>

        <div>
          <label className="block text-xs font-medium text-foreground mb-1">Full Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full max-w-md rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="border-t border-border pt-4 space-y-3">
          <div>
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Lock className="h-4 w-4 text-primary" />
              <span>Change Security Passphrase</span>
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Leave blank if you do not want to change your password.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <div className="text-[10px] text-muted-foreground mt-1">
                Min 10 chars, 1 number, 1 symbol.
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-border">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity shadow-xs"
          >
            <Save className="h-3.5 w-3.5" />
            <span>{saving ? "Saving Changes..." : "Save Profile Updates"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
