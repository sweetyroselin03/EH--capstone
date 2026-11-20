"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle,
  Clock,
  Server,
  ArrowRight,
  TrendingUp,
  Activity,
  Layers,
  Lock,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { formatStatus, formatSeverity, formatDate } from "@/lib/utils";

export default function DashboardPage() {
  const [assessments, setAssessments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch("/api/assessments");
        const json = await res.json();
        if (json.success && json.data) {
          setAssessments(json.data);
        }
      } catch (err) {
        console.warn("Could not load assessments:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Demo Metrics
  const severityData = [
    { name: "Critical", value: 3, color: "#ef4444" },
    { name: "High", value: 7, color: "#f97316" },
    { name: "Medium", value: 14, color: "#eab308" },
    { name: "Low", value: 12, color: "#3b82f6" },
    { name: "Info", value: 6, color: "#6b7280" },
  ];

  const riskRankingData = [
    { name: "Spring4Shell RCE", score: 98, asset: "api.ebank" },
    { name: "OpenSSH regreSSHion", score: 85, asset: "auth.lab" },
    { name: "PostgreSQL Cleartext", score: 82, asset: "db.staging" },
    { name: "Redis No-Auth", score: 80, asset: "cache.node" },
    { name: "Reflected XSS", score: 65, asset: "portal.web" },
    { name: "Missing HSTS", score: 48, asset: "app.public" },
  ];

  const trendData = [
    { day: "Mon", findings: 18, resolved: 4 },
    { day: "Tue", findings: 24, resolved: 8 },
    { day: "Wed", findings: 31, resolved: 14 },
    { day: "Thu", findings: 38, resolved: 22 },
    { day: "Fri", findings: 42, resolved: 29 },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* 1. Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-mono flex items-center gap-2.5">
            <Activity className="h-6 w-6 text-emerald-400" />
            <span>OPERATIONAL SECURITY CONSOLE</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Autonomous Vulnerability Assessment, Threat Correlation & Remediation Tracking
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/audit"
            className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
          >
            Verify Audit Chain
          </Link>
          <Link
            href="/assessments/new"
            className="rounded-md bg-emerald-600 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-emerald-500 shadow transition-colors flex items-center gap-1.5"
          >
            <span>+ Launch Assessment</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* 2. Key Performance Indicators (KPI Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-medium">Critical & High Threats</span>
            <ShieldAlert className="h-4 w-4 text-red-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-red-400 font-mono">10</span>
            <span className="text-xs text-zinc-500">of 42 total</span>
          </div>
          <div className="mt-2 text-[11px] text-zinc-400">
            Requires immediate mitigation or approval
          </div>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-medium">Discovered Assets</span>
            <Server className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-cyan-400 font-mono">14</span>
            <span className="text-xs text-emerald-400">100% in scope</span>
          </div>
          <div className="mt-2 text-[11px] text-zinc-400">
            Across 3 active subnet environments
          </div>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-medium">Resolution Rate</span>
            <CheckCircle className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-400 font-mono">69.0%</span>
            <span className="text-xs text-emerald-400">↑ 14% this week</span>
          </div>
          <div className="mt-2 text-[11px] text-zinc-400">
            29 findings verified and resolved
          </div>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-medium">Mean Time to Remediate</span>
            <Clock className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-400 font-mono">4.2h</span>
            <span className="text-xs text-zinc-500">Autonomous workflow</span>
          </div>
          <div className="mt-2 text-[11px] text-zinc-400">
            From scan detection to verified fix
          </div>
        </div>
      </div>

      {/* 3. Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Severity Donut */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
          <h2 className="text-sm font-semibold text-zinc-200 mb-1 flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-emerald-400" />
            <span>Finding Severity Distribution</span>
          </h2>
          <p className="text-xs text-zinc-400 mb-4">Normalized vulnerabilities by CVSS severity tier</p>
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={severityData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {severityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#18181b",
                    borderColor: "#27272a",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-3 mt-2 text-xs">
            {severityData.map((s) => (
              <span key={s.name} className="flex items-center gap-1.5 text-zinc-300">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
                <span>{s.name} ({s.value})</span>
              </span>
            ))}
          </div>
        </div>

        {/* Risk Prioritization Bar Chart */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
          <h2 className="text-sm font-semibold text-zinc-200 mb-1 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-cyan-400" />
            <span>Top Prioritized Vulnerabilities</span>
          </h2>
          <p className="text-xs text-zinc-400 mb-4">Risk score = f(severity, exposure, asset criticality)</p>
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={riskRankingData} layout="vertical" margin={{ top: 5, right: 10, left: 20, bottom: 5 }}>
                <XAxis type="number" domain={[0, 100]} stroke="#71717a" fontSize={10} />
                <YAxis dataKey="name" type="category" stroke="#a1a1aa" fontSize={10} width={100} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#18181b",
                    borderColor: "#27272a",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="score" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Trend Over Time */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
          <h2 className="text-sm font-semibold text-zinc-200 mb-1 flex items-center gap-2">
            <Layers className="h-4 w-4 text-emerald-400" />
            <span>Findings vs. Remediations Trend</span>
          </h2>
          <p className="text-xs text-zinc-400 mb-4">Cumulative remediation trajectory across sprints</p>
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <XAxis dataKey="day" stroke="#71717a" fontSize={11} />
                <YAxis stroke="#71717a" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#18181b",
                    borderColor: "#27272a",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Line type="monotone" dataKey="findings" stroke="#ef4444" strokeWidth={2} name="Total Findings" />
                <Line type="monotone" dataKey="resolved" stroke="#10b981" strokeWidth={2} name="Remediated" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-2 text-xs">
            <span className="flex items-center gap-1.5 text-zinc-300">
              <span className="h-2 w-2 rounded-full bg-red-500" />
              <span>Total Discovered</span>
            </span>
            <span className="flex items-center gap-1.5 text-zinc-300">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span>Verified Resolved</span>
            </span>
          </div>
        </div>
      </div>

      {/* 4. Active Assessments & Workflows */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
              <Server className="h-4 w-4 text-emerald-400" />
              <span>Security Assessments & Workflow State</span>
            </h2>
            <p className="text-xs text-zinc-400">Current assessments with live state machine progress</p>
          </div>
          <Link
            href="/assessments"
            className="text-xs font-medium text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
          >
            <span>View All ({assessments.length})</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-zinc-800 bg-zinc-950/50 text-zinc-400 uppercase font-mono">
              <tr>
                <th className="py-2.5 px-3">Assessment Name</th>
                <th className="py-2.5 px-3">Mode</th>
                <th className="py-2.5 px-3">Workflow State</th>
                <th className="py-2.5 px-3">Authorization Note</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 font-sans">
              {assessments.map((a) => {
                const statusFmt = formatStatus(a.status);
                return (
                  <tr key={a.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="py-3 px-3">
                      <Link href={`/assessments/${a.id}`} className="font-medium text-zinc-100 hover:text-emerald-400">
                        {a.name}
                      </Link>
                      <div className="text-[11px] text-zinc-500 font-mono mt-0.5">ID: {a.id.slice(0, 18)}...</div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-mono text-[11px] uppercase rounded border border-zinc-700 bg-zinc-800 px-1.5 py-0.5 text-zinc-300">
                        {a.mode}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-mono font-medium ${statusFmt.class}`}>
                        {statusFmt.label}
                      </span>
                    </td>
                    <td className="py-3 px-3 max-w-xs truncate text-zinc-400 text-[11px]">
                      {a.authorizationNote || "Authorized pentest"}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <Link
                        href={`/assessments/${a.id}`}
                        className="inline-flex items-center gap-1 rounded border border-zinc-700 bg-zinc-800 px-2.5 py-1 text-xs text-zinc-200 hover:bg-zinc-700 hover:text-white transition-colors"
                      >
                        <span>Open Console</span>
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
    </div>
  );
}
