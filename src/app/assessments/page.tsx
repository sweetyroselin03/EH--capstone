"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Target, Plus, ShieldCheck, ArrowRight, Filter } from "lucide-react";
import { formatStatus, formatDate } from "@/lib/utils";

export default function AssessmentsPage() {
  const [assessments, setAssessments] = useState<any[]>([]);
  const [filterMode, setFilterMode] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAssessments() {
      try {
        const res = await fetch("/api/assessments");
        const json = await res.json();
        if (json.success && json.data) {
          setAssessments(json.data);
        }
      } catch (err) {
        console.error("Error loading assessments:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchAssessments();
  }, []);

  const filtered = assessments.filter((a) => {
    if (filterMode === "all") return true;
    return a.mode === filterMode;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white font-mono flex items-center gap-2">
            <Target className="h-5 w-5 text-emerald-400" />
            <span>SECURITY ASSESSMENTS INVENTORY</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Manage penetration testing jobs, rules of engagement, and autonomous state machine progress
          </p>
        </div>

        <Link
          href="/assessments/new"
          className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-emerald-500 transition-colors shadow"
        >
          <Plus className="h-4 w-4" />
          <span>New Assessment Wizard</span>
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-zinc-400 flex items-center gap-1 mr-2">
          <Filter className="h-3.5 w-3.5" /> Filter Mode:
        </span>
        {["all", "demo", "passive", "worker"].map((m) => (
          <button
            key={m}
            onClick={() => setFilterMode(m)}
            className={`rounded-md px-3 py-1 text-xs font-mono uppercase transition-colors ${
              filterMode === m
                ? "bg-zinc-800 text-emerald-400 border border-zinc-700"
                : "text-zinc-400 hover:bg-zinc-900"
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      {/* Table Card */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-zinc-800 bg-zinc-950/70 text-zinc-400 uppercase font-mono">
            <tr>
              <th className="py-3 px-4">Assessment</th>
              <th className="py-3 px-4">Mode</th>
              <th className="py-3 px-4">Current Status</th>
              <th className="py-3 px-4">Authorization</th>
              <th className="py-3 px-4">Created Date</th>
              <th className="py-3 px-4 text-right">Console</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60 font-sans">
            {filtered.map((a) => {
              const statusFmt = formatStatus(a.status);
              return (
                <tr key={a.id} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="py-3.5 px-4">
                    <Link
                      href={`/assessments/${a.id}`}
                      className="font-medium text-zinc-100 hover:text-emerald-400"
                    >
                      {a.name}
                    </Link>
                    <div className="text-[11px] text-zinc-500 font-mono mt-0.5">
                      UUID: {a.id}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-mono uppercase text-zinc-300">
                    <span className="rounded border border-zinc-700 bg-zinc-800 px-2 py-0.5 text-[11px]">
                      {a.mode}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-mono font-medium ${statusFmt.class}`}
                    >
                      {statusFmt.label}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-zinc-300 text-[11px]">
                    <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      <span>Confirmed</span>
                    </span>
                    <span className="text-zinc-500 block truncate max-w-xs text-[10px]">
                      {a.authorizationNote || "Authorized pentest"}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-zinc-400 text-[11px]">
                    {formatDate(a.createdAt)}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <Link
                      href={`/assessments/${a.id}`}
                      className="inline-flex items-center gap-1.5 rounded border border-zinc-700 bg-zinc-800 px-3 py-1 text-xs text-zinc-200 hover:bg-zinc-700 hover:text-white transition-colors"
                    >
                      <span>Open Workspace</span>
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
