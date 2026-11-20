"use client";

import { useEffect, useState } from "react";
import {
  Users,
  Shield,
  UserPlus,
  CheckCircle2,
  XCircle,
  Clock,
  Copy,
  Check,
  AlertTriangle,
  RefreshCw,
  Power,
  PowerOff,
} from "lucide-react";
import { formatStatus, formatDate } from "@/lib/utils";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [invites, setInvites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  // Invite modal state
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("ANALYST");
  const [generatingInvite, setGeneratingInvite] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/admin/users");
      const json = await res.json();
      if (json.success) {
        setUsers(json.users || []);
        setInvites(json.invites || []);
      }
    } catch (err) {
      console.error("Failed to load users:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleApprove = async (userId: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
      });
      const json = await res.json();
      if (json.success) {
        setActionMsg("User successfully approved and activated.");
        await fetchUsers();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleReject = async (userId: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject" }),
      });
      const json = await res.json();
      if (json.success) {
        setActionMsg("User registration rejected.");
        await fetchUsers();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "change_role", role: newRole }),
      });
      const json = await res.json();
      if (json.success) {
        setActionMsg(`User role updated to ${newRole}.`);
        await fetchUsers();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleStatus = async (userId: string, currentStatus: string) => {
    const nextStatus = currentStatus === "DISABLED" ? "ACTIVE" : "DISABLED";
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle_status", status: nextStatus }),
      });
      const json = await res.json();
      if (json.success) {
        setActionMsg(`User status updated to ${nextStatus}.`);
        await fetchUsers();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;

    setGeneratingInvite(true);
    setGeneratedLink(null);

    try {
      const res = await fetch("/api/admin/users/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: inviteEmail.trim(),
          role: inviteRole,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setGeneratedLink(json.inviteLink);
        await fetchUsers();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setGeneratingInvite(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const pendingUsers = users.filter((u) => u.status === "PENDING_APPROVAL");
  const activeUsers = users.filter((u) => u.status !== "PENDING_APPROVAL");

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground font-mono flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <span>USER ACCESS & ONBOARDING MANAGEMENT</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Authorize self-registered accounts, manage organizational roles, and dispatch single-use invitations
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchUsers}
            title="Refresh Users"
            className="rounded border border-border bg-card p-2 text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => {
              setInviteModalOpen(true);
              setGeneratedLink(null);
            }}
            className="flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90 shadow-xs"
          >
            <UserPlus className="h-4 w-4" />
            <span>Invite User (One-Time Link)</span>
          </button>
        </div>
      </div>

      {actionMsg && (
        <div className="rounded-lg border border-primary/30 bg-primary/10 p-3 text-xs text-primary flex items-center justify-between font-mono">
          <span>{actionMsg}</span>
          <button onClick={() => setActionMsg(null)} className="text-primary hover:opacity-80">
            ×
          </button>
        </div>
      )}

      {/* 1. Pending Registrations Section */}
      <div className="rounded-xl border border-amber-500/30 bg-card p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-500" />
            <h2 className="text-sm font-semibold text-foreground">
              Pending Registrations Awaiting Admin Approval ({pendingUsers.length})
            </h2>
          </div>
          <span className="text-[11px] font-mono text-amber-600 dark:text-amber-400">
            Self-registered users blocked until authorized
          </span>
        </div>

        {pendingUsers.length === 0 ? (
          <div className="py-6 text-center text-xs text-muted-foreground">
            No accounts currently pending approval. All users verified!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border text-muted-foreground font-mono uppercase">
                <tr>
                  <th className="py-2 px-3">Applicant Name</th>
                  <th className="py-2 px-3">Email Address</th>
                  <th className="py-2 px-3">Default Role</th>
                  <th className="py-2 px-3">Registered At</th>
                  <th className="py-2 px-3 text-right">Approval Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {pendingUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-muted/50">
                    <td className="py-2.5 px-3 font-semibold text-foreground">{u.name}</td>
                    <td className="py-2.5 px-3 font-mono text-muted-foreground">{u.email}</td>
                    <td className="py-2.5 px-3 font-mono text-primary font-bold">{u.role}</td>
                    <td className="py-2.5 px-3 text-muted-foreground">{formatDate(u.createdAt)}</td>
                    <td className="py-2.5 px-3 text-right space-x-1.5">
                      <button
                        onClick={() => handleApprove(u.id)}
                        className="inline-flex items-center gap-1 rounded bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-500"
                      >
                        <CheckCircle2 className="h-3 w-3" />
                        <span>Approve</span>
                      </button>
                      <button
                        onClick={() => handleReject(u.id)}
                        className="inline-flex items-center gap-1 rounded border border-destructive/30 bg-destructive/10 px-2.5 py-1 text-xs font-semibold text-destructive hover:bg-destructive/20"
                      >
                        <XCircle className="h-3 w-3" />
                        <span>Reject</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 2. Active Directory & User List */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
        <div className="p-4 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <span>Active Security Personnel Directory ({activeUsers.length})</span>
          </h2>
          <p className="text-xs text-muted-foreground">
            Configure access roles (ADMIN, ANALYST, VIEWER) or disable accounts
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border bg-muted/30 text-muted-foreground uppercase font-mono">
              <tr>
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Assigned Role</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {activeUsers.map((u) => {
                const statusFmt = formatStatus(u.status);
                const isDisabled = u.status === "DISABLED";
                return (
                  <tr key={u.id} className="hover:bg-muted/50 transition-colors">
                    <td className="py-3 px-4 font-semibold text-foreground">{u.name}</td>
                    <td className="py-3 px-4 font-mono text-muted-foreground">{u.email}</td>
                    <td className="py-3 px-4">
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        className="rounded border border-border bg-background px-2 py-1 text-xs font-mono font-bold text-foreground focus:border-primary focus:outline-none"
                      >
                        <option value="ADMIN">ADMIN</option>
                        <option value="ANALYST">ANALYST</option>
                        <option value="VIEWER">VIEWER</option>
                      </select>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold ${statusFmt.class}`}>
                        {statusFmt.label}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleToggleStatus(u.id, u.status)}
                        className={`inline-flex items-center gap-1 rounded border px-2.5 py-1 text-xs font-medium transition-colors ${
                          isDisabled
                            ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20"
                            : "border-border bg-muted text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        }`}
                      >
                        {isDisabled ? (
                          <>
                            <Power className="h-3 w-3" />
                            <span>Enable User</span>
                          </>
                        ) : (
                          <>
                            <PowerOff className="h-3 w-3" />
                            <span>Disable</span>
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Generated Invites List */}
      {invites.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5 shadow-xs space-y-3">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            <span>Active One-Time Invites (Valid 48h)</span>
          </h2>

          <div className="space-y-2">
            {invites.map((inv) => (
              <div
                key={inv.id}
                className="flex items-center justify-between rounded-lg border border-border bg-muted/40 p-2.5 text-xs font-mono"
              >
                <div>
                  <span className="font-bold text-foreground">{inv.email}</span>
                  <span className="text-muted-foreground ml-2">Role: {inv.role}</span>
                  <span className="text-muted-foreground ml-2">
                    {inv.usedAt ? "● Claimed" : "● Unclaimed"}
                  </span>
                </div>
                <div className="text-[11px] text-muted-foreground">
                  Expires: {formatDate(inv.expiresAt)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {inviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              <span>Generate One-Time Invite Link</span>
            </h3>
            <p className="text-xs text-muted-foreground">
              Invitees can set their password directly and skip the admin approval waiting queue. Valid for 48 hours.
            </p>

            {generatedLink ? (
              <div className="space-y-3">
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-600 dark:text-emerald-400 font-mono">
                  ✓ One-time invite link generated successfully!
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono text-muted-foreground">
                    Shareable Invitation Link
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={generatedLink}
                      className="w-full rounded border border-input bg-background p-2 text-xs font-mono text-foreground"
                    />
                    <button
                      type="button"
                      onClick={() => copyToClipboard(generatedLink)}
                      className="rounded bg-primary p-2 text-primary-foreground hover:opacity-90"
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setInviteModalOpen(false);
                      setGeneratedLink(null);
                      setInviteEmail("");
                    }}
                    className="rounded bg-secondary px-4 py-1.5 text-xs font-semibold text-secondary-foreground hover:bg-muted"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateInvite} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Invitee Email
                  </label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="specialist@agency.gov"
                    required
                    className="w-full rounded border border-input bg-background p-2 text-xs text-foreground focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Pre-approved Role
                  </label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="w-full rounded border border-input bg-background p-2 text-xs font-mono text-foreground focus:border-primary focus:outline-none"
                  >
                    <option value="ANALYST">ANALYST (Standard Operations)</option>
                    <option value="VIEWER">VIEWER (Read-Only Compliance)</option>
                    <option value="ADMIN">ADMIN (Full Security Control)</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setInviteModalOpen(false)}
                    className="rounded border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={generatingInvite}
                    className="rounded bg-primary px-4 py-1.5 text-xs font-bold text-primary-foreground hover:opacity-90 disabled:opacity-50"
                  >
                    {generatingInvite ? "Generating..." : "Generate Invite Link"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
