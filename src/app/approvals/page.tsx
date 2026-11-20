"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, ThumbsUp, ThumbsDown, ShieldAlert, ArrowRight, RefreshCw } from "lucide-react";

export default function ApprovalsPage() {
  const [assessments, setAssessments] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionDone, setActionDone] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch("/api/assessments");
        const json = await res.json();
        if (json.success && json.data) {
          setAssessments(json.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="border-b border-zinc-800 pb-5">
        <h1 className="text-xl font-bold tracking-tight text-white font-mono flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          <span>HUMAN APPROVAL GATES & SENSITIVE ACTIONS INBOX</span>
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Review and authorize high-impact remediations, configuration changes on critical assets, and intrusive actions
        </p>
      </div>

      <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 text-xs text-amber-300 flex items-start gap-3">
        <ShieldAlert className="h-5 w-5 shrink-0 text-amber-400 mt-0.5" />
        <div>
          <div className="font-bold uppercase font-mono">Autonomous Safety Guardrail Active</div>
          The system strictly forbids autonomous execution of actions flagged as sensitive. Every decision must be authorized with an audit-logged reason.
        </div>
      </div>

      <div className="space-y-4">
        {assessments
          .filter((a) => a.status === "AWAITING_APPROVAL" || a.status === "REMEDIATING")
          .map((a) => (
            <div key={a.id} className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="rounded bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 text-[10px] font-mono text-amber-400 font-bold">
                    PENDING AUTHORIZATION
                  </span>
                  <h3 className="text-sm font-bold text-zinc-100 mt-1">{a.name}</h3>
                  <div className="text-xs text-zinc-400 font-mono">Mode: {a.mode} • Ref: {a.id}</div>
                </div>

                <Link
                  href={`/assessments/${a.id}`}
                  className="flex items-center gap-1 rounded bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 transition-colors"
                >
                  <span>Open Assessment Inbox</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          ))}

        {assessments.filter((a) => a.status === "AWAITING_APPROVAL").length === 0 && (
          <div className="rounded-xl border border-dashed border-zinc-800 p-12 text-center text-xs text-zinc-500 space-y-2">
            <CheckCircle2 className="h-8 w-8 mx-auto text-emerald-500/50" />
            <div>All sensitive actions have been reviewed and decided. Approvals inbox clear!</div>
          </div>
        )}
      </div>
    </div>
  );
}
