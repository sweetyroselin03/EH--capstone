"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Target, Plus, ShieldCheck, ArrowRight, Filter } from "lucide-react";
import { formatStatus, formatDate } from "@/lib/utils";

export default function AssessmentsPage() {
  const [assessments, setAssessments] = useState<any[]>([]);
  const [filterMode, setFilterMode] = useState<string>("all");
  const [userRole, setUserRole] = useState<string>("ADMIN");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [assRes, profRes] = await Promise.all([
          fetch("/api/assessments"),
          fetch("/api/user/profile"),
        ]);
        const assJson = await assRes.json();
        const profJson = await profRes.json();

        if (assJson.success && assJson.data) {
          setAssessments(assJson.data);
        }
        if (profJson.success && profJson.user) {
          setUserRole(profJson.user.role);
        }
      } catch (err) {
        console.error("Error loading assessments:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const filtered = assessments.filter((a) => {
    if (filterMode === "all") return true;
    return a.mode === filterMode;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground font-mono flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            <span>SECURITY ASSESSMENTS INVENTORY</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage penetration testing jobs, rules of engagement, and autonomous state machine progress
          </p>
        </div>

        {userRole !== "VIEWER" && (
          <Link
            href="/assessments/new"
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90 transition-opacity shadow-xs"
          >
            <Plus className="h-4 w-4" />
            <span>New Assessment Wizard</span>
          </Link>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground flex items-center gap-1 mr-2">
          <Filter className="h-3.5 w-3.5" /> Filter Mode:
        </span>
        {["all", "demo", "passive", "worker"].map((m) => (
          <button
            key={m}
            onClick={() => setFilterMode(m)}
            className={`rounded-md px-3 py-1 text-xs font-mono uppercase transition-colors ${
              filterMode === m
                ? "bg-secondary text-primary font-bold border border-border"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      {/* Table Card */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-border bg-muted/40 text-muted-foreground uppercase font-mono">
            <tr>
              <th className="py-3 px-4">Assessment</th>
              <th className="py-3 px-4">Mode</th>
              <th className="py-3 px-4">Current Status</th>
              <th className="py-3 px-4">Authorization</th>
              <th className="py-3 px-4">Created Date</th>
              <th className="py-3 px-4 text-right">Console</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border font-sans">
            {filtered.map((a) => {
              const statusFmt = formatStatus(a.status);
              return (
                <tr key={a.id} className="hover:bg-muted/50 transition-colors">
                  <td className="py-3.5 px-4">
                    <Link
                      href={`/assessments/${a.id}`}
                      className="font-semibold text-foreground hover:text-primary"
                    >
                      {a.name}
                    </Link>
                    <div className="text-[11px] text-muted-foreground font-mono mt-0.5">
                      UUID: {a.id}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-mono uppercase text-foreground">
                    <span className="rounded border border-border bg-muted px-2 py-0.5 text-[11px]">
                      {a.mode}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-mono font-bold ${statusFmt.class}`}
                    >
                      {statusFmt.label}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-[11px]">
                    <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      <span>Confirmed</span>
                    </span>
                    <span className="text-muted-foreground block truncate max-w-xs text-[10px]">
                      {a.authorizationNote || "Authorized pentest"}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-muted-foreground text-[11px]">
                    {formatDate(a.createdAt)}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <Link
                      href={`/assessments/${a.id}`}
                      className="inline-flex items-center gap-1.5 rounded border border-border bg-card px-3 py-1 text-xs text-foreground hover:bg-muted transition-colors"
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
