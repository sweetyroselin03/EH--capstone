"use client";

import { Users, Shield, UserPlus } from "lucide-react";

export default function AdminUsersPage() {
  const users = [
    {
      id: "u1",
      name: "Lead Security Administrator",
      email: "admin@aeha.local",
      role: "ADMIN",
      created: "Initial Provisioning",
      status: "Active",
    },
    {
      id: "u2",
      name: "SOC Senior Analyst",
      email: "analyst@aeha.local",
      role: "ANALYST",
      created: "Initial Provisioning",
      status: "Active",
    },
    {
      id: "u3",
      name: "Compliance Audit Officer",
      email: "viewer@aeha.local",
      role: "VIEWER",
      created: "Role-Based Access",
      status: "Active",
    },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white font-mono flex items-center gap-2">
            <Users className="h-5 w-5 text-emerald-400" />
            <span>ROLE-BASED ACCESS CONTROL (RBAC)</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Manage authenticated security personnel, analysts, and read-only compliance viewers
          </p>
        </div>

        <button
          type="button"
          className="flex items-center gap-1.5 rounded bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500"
        >
          <UserPlus className="h-4 w-4" />
          <span>Provision User</span>
        </button>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-zinc-800 bg-zinc-950/70 text-zinc-400 uppercase font-mono">
            <tr>
              <th className="py-3 px-4">User Name</th>
              <th className="py-3 px-4">Email</th>
              <th className="py-3 px-4">Role</th>
              <th className="py-3 px-4">Provisioning</th>
              <th className="py-3 px-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60 font-sans">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-zinc-800/30">
                <td className="py-3.5 px-4 font-semibold text-zinc-100">{u.name}</td>
                <td className="py-3.5 px-4 font-mono text-zinc-300">{u.email}</td>
                <td className="py-3.5 px-4">
                  <span
                    className={`rounded border px-2 py-0.5 font-mono text-[10px] font-bold ${
                      u.role === "ADMIN"
                        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                        : u.role === "ANALYST"
                        ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-400"
                        : "border-zinc-700 bg-zinc-800 text-zinc-300"
                    }`}
                  >
                    {u.role}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-zinc-400">{u.created}</td>
                <td className="py-3.5 px-4">
                  <span className="flex items-center gap-1 text-emerald-400 font-mono text-[11px]">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                    {u.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
