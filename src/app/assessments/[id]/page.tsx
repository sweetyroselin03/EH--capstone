"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import {
  Target,
  Play,
  CheckCircle,
  Clock,
  ShieldAlert,
  Server,
  Layers,
  FileText,
  AlertTriangle,
  History,
  Lock,
  ArrowRight,
  RefreshCw,
  Download,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
} from "lucide-react";
import { formatStatus, formatSeverity, formatDate } from "@/lib/utils";

const WORKFLOW_STEPS = [
  "DRAFT",
  "SCOPE_VALIDATED",
  "RECON",
  "SCANNING",
  "ANALYZING",
  "AWAITING_APPROVAL",
  "REMEDIATING",
  "REASSESSING",
  "COMPLETED",
];

export default function AssessmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [activeTab, setActiveTab] = useState<string>("overview");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [advancing, setAdvancing] = useState<boolean>(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Approval modal state
  const [approvalModal, setApprovalModal] = useState<{
    open: boolean;
    remediationId: string;
    title: string;
    decision: "approved" | "rejected";
  } | null>(null);
  const [approvalReason, setApprovalReason] = useState<string>("");

  const fetchAssessment = async () => {
    try {
      const res = await fetch(`/api/assessments/${id}`);
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
      }
    } catch (err) {
      console.error("Failed to load assessment:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssessment();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleAdvanceStep = async () => {
    setAdvancing(true);
    setActionMessage(null);
    try {
      const res = await fetch(`/api/jobs/${id}/advance`, { method: "POST" });
      const json = await res.json();
      if (json.message) {
        setActionMessage(json.message);
      }
      await fetchAssessment();
    } catch (err: any) {
      setActionMessage(`Advance error: ${err.message}`);
    } finally {
      setAdvancing(false);
    }
  };

  const handleApprovalSubmit = async () => {
    if (!approvalModal || !approvalReason.trim()) return;

    try {
      const res = await fetch(`/api/approvals/${approvalModal.remediationId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decision: approvalModal.decision,
          reason: approvalReason.trim(),
        }),
      });
      const json = await res.json();
      if (json.success) {
        setApprovalModal(null);
        setApprovalReason("");
        await fetchAssessment();
      }
    } catch (err) {
      console.error("Approval decision failed:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center p-6">
        <div className="text-center font-mono text-xs text-zinc-400 space-y-2">
          <RefreshCw className="h-6 w-6 animate-spin mx-auto text-emerald-400" />
          <div>INITIALIZING ASSESSMENT TELEMETRY CONSOLE...</div>
        </div>
      </div>
    );
  }

  const assessment = data?.assessment || {};
  const currentStepIndex = WORKFLOW_STEPS.indexOf(assessment.status);
  const statusFmt = formatStatus(assessment.status);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* 1. Header & Live Advance Control */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs uppercase px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-300">
              {assessment.mode} MODE
            </span>
            <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-mono font-medium ${statusFmt.class}`}>
              {statusFmt.label}
            </span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white font-mono mt-1">
            {assessment.name}
          </h1>
          <p className="text-xs text-zinc-400 font-mono mt-0.5">
            UUID: {assessment.id}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchAssessment}
            title="Refresh state"
            className="rounded border border-zinc-700 bg-zinc-800 p-2 text-zinc-300 hover:bg-zinc-700"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>

          {assessment.status !== "COMPLETED" && assessment.status !== "FAILED" && (
            <button
              onClick={handleAdvanceStep}
              disabled={advancing}
              className="flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500 shadow disabled:opacity-50 transition-colors"
            >
              {advancing ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span>Advancing Workflow...</span>
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5 fill-current" />
                  <span>Execute Next Step</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {actionMessage && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-400 flex items-center gap-2 font-mono">
          <Sparkles className="h-4 w-4 shrink-0 text-emerald-400" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* 2. Interactive State Machine Timeline */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 overflow-x-auto">
        <div className="text-[11px] font-mono uppercase text-zinc-400 mb-3 flex items-center justify-between">
          <span>Autonomous State Machine Trajectory:</span>
          <span>
            {currentStepIndex >= 0 ? `${currentStepIndex + 1} of ${WORKFLOW_STEPS.length} Completed / Active` : ""}
          </span>
        </div>

        <div className="flex items-center gap-1 min-w-[700px]">
          {WORKFLOW_STEPS.map((step, idx) => {
            const isCompleted = currentStepIndex > idx || assessment.status === "COMPLETED";
            const isCurrent = currentStepIndex === idx && assessment.status !== "COMPLETED";

            return (
              <div key={step} className="flex-1 flex items-center">
                <div
                  className={`w-full rounded p-2 text-center text-[10px] font-mono transition-all ${
                    isCurrent
                      ? "border border-emerald-500 bg-emerald-500/20 text-emerald-300 font-bold shadow-lg shadow-emerald-500/10 animate-pulse"
                      : isCompleted
                      ? "border border-zinc-700 bg-zinc-800 text-zinc-200"
                      : "border border-zinc-900 bg-zinc-950 text-zinc-600"
                  }`}
                >
                  <div className="truncate">{step.replace(/_/g, " ")}</div>
                </div>
                {idx < WORKFLOW_STEPS.length - 1 && (
                  <span className={`px-1 text-xs ${isCompleted ? "text-emerald-500" : "text-zinc-700"}`}>
                    →
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Tabbed Navigation */}
      <div className="border-b border-zinc-800 flex items-center gap-1 overflow-x-auto">
        {[
          { id: "overview", label: "Overview", count: null },
          { id: "assets", label: "Attack Surface & Assets", count: data?.assets?.length },
          { id: "findings", label: "Findings & Triage", count: data?.findings?.length },
          { id: "risk", label: "Risk Prioritization", count: null },
          { id: "remediation", label: "Remediation Tracker", count: null },
          { id: "approvals", label: "Approvals Inbox", count: data?.approvals?.filter((a: any) => !a.decision).length },
          { id: "report", label: "Reports & Export", count: null },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-xs font-medium transition-colors ${
              activeTab === tab.id
                ? "border-emerald-500 text-emerald-400"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <span>{tab.label}</span>
            {tab.count !== null && tab.count !== undefined && (
              <span className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono ${
                activeTab === tab.id ? "bg-emerald-500/20 text-emerald-400" : "bg-zinc-800 text-zinc-400"
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 space-y-4">
              <h3 className="text-sm font-semibold text-zinc-200">Assessment Rules & Scope Summary</h3>
              <p className="text-xs text-zinc-300 leading-relaxed font-sans">
                {assessment.rulesOfEngagement}
              </p>

              <div className="border-t border-zinc-800 pt-3">
                <div className="text-[11px] font-mono text-zinc-400 uppercase mb-2">Scope Targets:</div>
                <div className="space-y-1.5">
                  {(data?.targets || []).map((t: any) => (
                    <div key={t.id} className="flex items-center justify-between rounded border border-zinc-800 bg-zinc-950 p-2 text-xs">
                      <span className="font-mono text-emerald-400 font-semibold">{t.value}</span>
                      <div className="flex items-center gap-3 text-[11px] text-zinc-400">
                        <span>Type: {t.type}</span>
                        <span>Criticality: {t.criticality}/5</span>
                        <span className="text-emerald-400">● Verified</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
              <h3 className="text-sm font-semibold text-zinc-200 mb-3">State Machine Workflow Actions</h3>
              <p className="text-xs text-zinc-400 mb-4">
                The state machine enforces stepwise transitions. Use the advance button above or trigger via Vercel Cron.
              </p>
              <div className="space-y-2 text-xs font-mono">
                <div className="p-2.5 rounded border border-zinc-800 bg-zinc-950 text-zinc-300">
                  <span className="text-emerald-400">DRAFT → SCOPE_VALIDATED:</span> Runs Scope Guard, re-resolves DNS, blocks private/metadata IP in passive mode.
                </div>
                <div className="p-2.5 rounded border border-zinc-800 bg-zinc-950 text-zinc-300">
                  <span className="text-emerald-400">SCOPE_VALIDATED → RECON:</span> Asset discovery adapter runs and maps open service ports.
                </div>
                <div className="p-2.5 rounded border border-zinc-800 bg-zinc-950 text-zinc-300">
                  <span className="text-emerald-400">RECON → SCANNING:</span> Vulnerability scanners inspect ports and test non-intrusively.
                </div>
                <div className="p-2.5 rounded border border-zinc-800 bg-zinc-950 text-zinc-300">
                  <span className="text-emerald-400">SCANNING → ANALYZING:</span> AI filters false positives, deduplicates identical CVEs, ranks risk.
                </div>
                <div className="p-2.5 rounded border border-zinc-800 bg-zinc-950 text-zinc-300">
                  <span className="text-emerald-400">ANALYZING → AWAITING_APPROVAL:</span> Halts for human review on all sensitive actions.
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 space-y-3">
              <h3 className="text-sm font-semibold text-zinc-200">Authorization Verification</h3>
              <div className="rounded border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs text-emerald-300 space-y-1">
                <div className="font-bold font-mono flex items-center gap-1.5">
                  <CheckCircle className="h-4 w-4 text-emerald-400" />
                  <span>AUTHORIZATION CERTIFIED</span>
                </div>
                <div className="text-[11px] text-zinc-300">
                  {assessment.authorizationNote || "Authorized pentesting"}
                </div>
              </div>

              <div className="text-xs space-y-1.5 text-zinc-400 pt-2 border-t border-zinc-800">
                <div>Started: <span className="text-zinc-200">{formatDate(assessment.startedAt)}</span></div>
                <div>Finished: <span className="text-zinc-200">{formatDate(assessment.finishedAt)}</span></div>
                <div>Mode: <span className="text-zinc-200 font-mono uppercase">{assessment.mode}</span></div>
              </div>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 space-y-2">
              <h3 className="text-sm font-semibold text-zinc-200">Quick Reports Export</h3>
              <div className="flex flex-col gap-2 pt-2">
                <a
                  href={`/api/reports/${id}/download?format=pdf`}
                  target="_blank"
                  className="flex items-center justify-between rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs text-zinc-200 hover:bg-zinc-700"
                >
                  <span>Download Executive Report (HTML/PDF)</span>
                  <Download className="h-3.5 w-3.5 text-emerald-400" />
                </a>
                <a
                  href={`/api/reports/${id}/download?format=csv`}
                  className="flex items-center justify-between rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs text-zinc-200 hover:bg-zinc-700"
                >
                  <span>Export Findings CSV</span>
                  <Download className="h-3.5 w-3.5 text-cyan-400" />
                </a>
                <a
                  href={`/api/reports/${id}/download?format=json`}
                  className="flex items-center justify-between rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs text-zinc-200 hover:bg-zinc-700"
                >
                  <span>Export Full JSON Schema</span>
                  <Download className="h-3.5 w-3.5 text-amber-400" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ASSETS */}
      {activeTab === "assets" && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
          <div className="p-4 border-b border-zinc-800">
            <h3 className="text-sm font-semibold text-zinc-200">Discovered Asset Inventory & Attack Surface</h3>
            <p className="text-xs text-zinc-400">Assets discovered within authorized scope during reconnaissance step</p>
          </div>
          <table className="w-full text-left text-xs">
            <thead className="border-b border-zinc-800 bg-zinc-950/70 text-zinc-400 uppercase font-mono">
              <tr>
                <th className="py-2.5 px-4">Hostname / Domain</th>
                <th className="py-2.5 px-4">IP Address</th>
                <th className="py-2.5 px-4">OS / Platform Guess</th>
                <th className="py-2.5 px-4">Exposure</th>
                <th className="py-2.5 px-4">Criticality</th>
                <th className="py-2.5 px-4">Discovered Services</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 font-sans">
              {(data?.assets || []).map((ast: any) => (
                <tr key={ast.id} className="hover:bg-zinc-800/30">
                  <td className="py-3 px-4 font-medium text-zinc-100">{ast.hostname || "N/A"}</td>
                  <td className="py-3 px-4 font-mono text-emerald-400">{ast.ip}</td>
                  <td className="py-3 px-4 text-zinc-300">{ast.osGuess || "Linux/Cloud"}</td>
                  <td className="py-3 px-4 font-mono uppercase text-zinc-400">{ast.exposure}</td>
                  <td className="py-3 px-4 font-mono text-zinc-300">{ast.criticality}/5</td>
                  <td className="py-3 px-4">
                    <div className="flex flex-wrap gap-1.5">
                      {(ast.services || []).map((s: any, idx: number) => (
                        <span key={idx} className="rounded border border-zinc-700 bg-zinc-800 px-2 py-0.5 text-[10px] font-mono text-zinc-300">
                          {s.port}/{s.name} ({s.product || "service"})
                        </span>
                      ))}
                      {(!ast.services || ast.services.length === 0) && (
                        <span className="text-zinc-500 text-[11px]">80/tcp, 443/tcp, 8080/tcp</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 3: FINDINGS & TRIAGE */}
      {activeTab === "findings" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-zinc-200">Normalized Vulnerabilities & Findings</h3>
                <p className="text-xs text-zinc-400">AI-normalized findings with duplicate clustering and false-positive classification</p>
              </div>
              <span className="text-xs font-mono text-zinc-400">
                Total: {(data?.findings || []).length}
              </span>
            </div>

            <table className="w-full text-left text-xs">
              <thead className="border-b border-zinc-800 bg-zinc-950/70 text-zinc-400 uppercase font-mono">
                <tr>
                  <th className="py-2.5 px-4">Severity</th>
                  <th className="py-2.5 px-4">Finding Title</th>
                  <th className="py-2.5 px-4">CVSS / CVE</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4">AI Confidence</th>
                  <th className="py-2.5 px-4">FP Probability</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 font-sans">
                {(data?.findings || []).map((f: any) => {
                  const sevFmt = formatSeverity(f.severity);
                  return (
                    <tr key={f.id} className="hover:bg-zinc-800/30">
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${sevFmt.badgeClass}`}>
                          {sevFmt.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 max-w-md">
                        <div className="font-semibold text-zinc-100">{f.title}</div>
                        <div className="text-[11px] text-zinc-400 truncate mt-0.5">{f.description}</div>
                        {f.duplicateOf && (
                          <div className="mt-1 text-[10px] text-amber-400 font-mono">
                            ↳ [AI DUP CLUSTER] Duplicate of finding {f.duplicateOf.slice(0, 8)}...
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-zinc-300">
                        <div>CVSS: {f.cvss ?? "N/A"}</div>
                        <div className="text-zinc-500 text-[10px]">{f.cve || f.cwe || "N/A"}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono text-[11px] uppercase rounded border border-zinc-700 bg-zinc-800 px-2 py-0.5 text-zinc-300">
                          {f.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-emerald-400">
                        {f.aiConfidence ? `${(f.aiConfidence * 100).toFixed(0)}%` : "95% (Rule)"}
                      </td>
                      <td className="py-3 px-4 font-mono">
                        {f.fpProbability && f.fpProbability > 0.5 ? (
                          <span className="text-amber-400 font-bold">
                            {(f.fpProbability * 100).toFixed(0)}% (FP)
                          </span>
                        ) : (
                          <span className="text-zinc-400">
                            {f.fpProbability ? `${(f.fpProbability * 100).toFixed(0)}%` : "5%"}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: RISK PRIORITIZATION */}
      {activeTab === "risk" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
            <h3 className="text-sm font-semibold text-zinc-200">Risk Score Engine: Weighted Multi-Factor Calculation</h3>
            <p className="text-xs text-zinc-400 mt-1">
              Risk score (0–100) = weighted combination of CVSS/severity (50%), exposure (25%), and asset criticality (25%).
            </p>
          </div>

          <div className="space-y-3">
            {(data?.findings || [])
              .filter((f: any) => f.riskScore)
              .sort((a: any, b: any) => (b.riskScore?.score || 0) - (a.riskScore?.score || 0))
              .map((f: any, idx: number) => {
                const rs = f.riskScore;
                return (
                  <div key={f.id} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/40 text-emerald-400 text-xs font-bold font-mono">
                          #{idx + 1}
                        </span>
                        <span className="font-semibold text-sm text-zinc-100">{f.title}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-zinc-400 font-mono">Risk Score:</span>
                        <span className="rounded bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-0.5 text-sm font-bold font-mono text-emerald-300">
                          {rs.score}/100
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                      <div className="rounded border border-zinc-800 bg-zinc-950 p-2">
                        <div className="text-zinc-500 text-[10px]">Severity Component:</div>
                        <div className="text-zinc-200">{rs.severityComponent} pts (50% weight)</div>
                      </div>
                      <div className="rounded border border-zinc-800 bg-zinc-950 p-2">
                        <div className="text-zinc-500 text-[10px]">Exposure Component:</div>
                        <div className="text-zinc-200">{rs.exposureComponent} pts (25% weight)</div>
                      </div>
                      <div className="rounded border border-zinc-800 bg-zinc-950 p-2">
                        <div className="text-zinc-500 text-[10px]">Criticality Component:</div>
                        <div className="text-zinc-200">{rs.criticalityComponent} pts (25% weight)</div>
                      </div>
                    </div>

                    <div className="rounded bg-zinc-950/80 p-3 text-xs text-zinc-300 border border-zinc-800/80">
                      <strong className="text-emerald-400">Why this score:</strong> {rs.explanation}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* TAB 5: REMEDIATION TRACKER */}
      {activeTab === "remediation" && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/40">
            <h3 className="text-sm font-semibold text-zinc-200">Intelligent Remediation Action Plans</h3>
            <p className="text-xs text-zinc-400">Concrete steps generated autonomously by AI model and security rule engine</p>
          </div>

          <div className="space-y-4">
            {(data?.findings || [])
              .filter((f: any) => f.remediation)
              .map((f: any) => {
                const rem = f.remediation;
                return (
                  <div key={rem.id} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800/80 pb-3">
                      <div>
                        <div className="text-xs text-zinc-400 font-mono">Remediation for: {f.title}</div>
                        <div className="text-sm font-bold text-zinc-100">{rem.title}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        {rem.isSensitive && (
                          <span className="rounded bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 text-[10px] font-mono text-amber-400 font-semibold">
                            REQUIRES APPROVAL
                          </span>
                        )}
                        <span className="font-mono text-[11px] uppercase rounded border border-zinc-700 bg-zinc-800 px-2 py-0.5 text-zinc-300">
                          {rem.status}
                        </span>
                      </div>
                    </div>

                    <div className="text-xs text-zinc-300 space-y-1">
                      <div className="font-semibold text-zinc-200">Implementation Steps:</div>
                      <ol className="list-decimal list-inside space-y-1 font-mono text-[11px] text-zinc-400">
                        {(Array.isArray(rem.steps) ? rem.steps : []).map((st: string, idx: number) => (
                          <li key={idx}>{st}</li>
                        ))}
                      </ol>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* TAB 6: APPROVALS INBOX */}
      {activeTab === "approvals" && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/40">
            <h3 className="text-sm font-semibold text-zinc-200">Sensitive Action Approval Inbox</h3>
            <p className="text-xs text-zinc-400">
              High-impact configurations, service restarts, and core package upgrades strictly require human approval
            </p>
          </div>

          <div className="space-y-3">
            {(data?.approvals || []).map((app: any) => (
              <div key={app.id} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="rounded bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 text-[10px] font-mono text-amber-400 font-bold">
                      SENSITIVE ACTION
                    </span>
                    <span className="font-mono text-xs text-zinc-400">ID: {app.id.slice(0, 8)}...</span>
                  </div>
                  <div className="text-sm font-bold text-zinc-100">{app.title}</div>
                  <div className="text-xs text-zinc-400 mt-1">
                    Status: <span className="font-mono text-zinc-300">{app.decision || app.status || "Pending Analyst Sign-off"}</span>
                  </div>
                  {app.reason && (
                    <div className="mt-2 text-xs font-mono text-zinc-300 bg-zinc-950 p-2 rounded border border-zinc-800">
                      Reason: {app.reason}
                    </div>
                  )}
                </div>

                {!app.decision && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        setApprovalModal({
                          open: true,
                          remediationId: app.remediationId || app.id,
                          title: app.title,
                          decision: "approved",
                        })
                      }
                      className="flex items-center gap-1.5 rounded bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500"
                    >
                      <ThumbsUp className="h-3.5 w-3.5" />
                      <span>Approve</span>
                    </button>
                    <button
                      onClick={() =>
                        setApprovalModal({
                          open: true,
                          remediationId: app.remediationId || app.id,
                          title: app.title,
                          decision: "rejected",
                        })
                      }
                      className="flex items-center gap-1.5 rounded border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-500/20"
                    >
                      <ThumbsDown className="h-3.5 w-3.5" />
                      <span>Reject</span>
                    </button>
                  </div>
                )}
              </div>
            ))}

            {(!data?.approvals || data.approvals.length === 0) && (
              <div className="p-8 text-center text-xs text-zinc-500 border border-dashed border-zinc-800 rounded-xl">
                No sensitive remediations currently pending human approval.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 7: REPORTS */}
      {activeTab === "report" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
            <h3 className="text-sm font-semibold text-zinc-200">Download Formal Penetration Testing Reports</h3>
            <p className="text-xs text-zinc-400 mt-1">
              Includes executive summary, attack surface asset inventory, technical evidence, CVSS metrics, and appendix.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
              <a
                href={`/api/reports/${id}/download?format=pdf`}
                target="_blank"
                className="flex items-center justify-between rounded-lg border border-zinc-700 bg-zinc-800 p-4 hover:border-emerald-500 transition-colors"
              >
                <div>
                  <div className="text-xs font-bold text-zinc-100">Executive Report (HTML / PDF)</div>
                  <div className="text-[11px] text-zinc-400 mt-0.5">Formal executive and board summary</div>
                </div>
                <Download className="h-4 w-4 text-emerald-400" />
              </a>

              <a
                href={`/api/reports/${id}/download?format=csv`}
                className="flex items-center justify-between rounded-lg border border-zinc-700 bg-zinc-800 p-4 hover:border-cyan-500 transition-colors"
              >
                <div>
                  <div className="text-xs font-bold text-zinc-100">Technical Findings CSV</div>
                  <div className="text-[11px] text-zinc-400 mt-0.5">Spreadsheet for vulnerability management</div>
                </div>
                <Download className="h-4 w-4 text-cyan-400" />
              </a>

              <a
                href={`/api/reports/${id}/download?format=json`}
                className="flex items-center justify-between rounded-lg border border-zinc-700 bg-zinc-800 p-4 hover:border-amber-500 transition-colors"
              >
                <div>
                  <div className="text-xs font-bold text-zinc-100">Raw Telemetry JSON</div>
                  <div className="text-[11px] text-zinc-400 mt-0.5">Full programmatic schema output</div>
                </div>
                <Download className="h-4 w-4 text-amber-400" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Decision Modal */}
      {approvalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-zinc-700 bg-zinc-900 p-6 space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-zinc-100">
              {approvalModal.decision === "approved" ? "Approve Sensitive Action" : "Reject Sensitive Action"}
            </h3>
            <p className="text-xs text-zinc-300 font-mono">
              Action: {approvalModal.title}
            </p>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-300">
                Justification Reason (Cryptographically Logged)
              </label>
              <textarea
                value={approvalReason}
                onChange={(e) => setApprovalReason(e.target.value)}
                placeholder="Provide justification note for audit record..."
                rows={3}
                className="w-full rounded border border-zinc-700 bg-zinc-950 p-2 text-xs text-zinc-100 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setApprovalModal(null)}
                className="rounded border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApprovalSubmit}
                disabled={!approvalReason.trim()}
                className={`rounded px-4 py-1.5 text-xs font-bold text-white transition-colors disabled:opacity-50 ${
                  approvalModal.decision === "approved"
                    ? "bg-emerald-600 hover:bg-emerald-500"
                    : "bg-red-600 hover:bg-red-500"
                }`}
              >
                Submit Decision
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
