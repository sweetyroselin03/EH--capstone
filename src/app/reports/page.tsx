"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText, Download, Target, ArrowRight } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function ReportsPage() {
  const [assessments, setAssessments] = useState<any[]>([]);

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
      }
    }
    loadData();
  }, []);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="border-b border-border pb-5">
        <h1 className="text-xl font-bold tracking-tight text-foreground font-mono flex items-center gap-2">
          <FileText className="h-5 w-5 text-emerald-500" />
          <span>CENTRALIZED REPORTS & AUDIT ARCHIVE</span>
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Generate, preview, and download formal executive reports and technical findings (PDF, CSV, JSON)
        </p>
      </div>

      <div className="space-y-4">
        {assessments.map((a) => (
          <div key={a.id} className="rounded-xl border border-border bg-card p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] uppercase rounded border border-border bg-muted px-1.5 py-0.5 text-foreground">
                  {a.mode} MODE
                </span>
                <span className="font-mono text-[10px] text-muted-foreground">STATUS: {a.status}</span>
              </div>
              <h3 className="text-sm font-bold text-foreground mt-1">{a.name}</h3>
              <div className="text-xs text-muted-foreground font-mono mt-0.5">Created: {formatDate(a.createdAt)}</div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <a
                href={`/api/reports/${a.id}/download?format=pdf`}
                target="_blank"
                className="flex items-center gap-1.5 rounded border border-border bg-muted/80 px-3 py-1.5 text-xs text-foreground hover:bg-accent transition-colors"
              >
                <Download className="h-3 w-3 text-emerald-500" />
                <span>Executive PDF / HTML</span>
              </a>

              <a
                href={`/api/reports/${a.id}/download?format=csv`}
                className="flex items-center gap-1.5 rounded border border-border bg-muted/80 px-3 py-1.5 text-xs text-foreground hover:bg-accent transition-colors"
              >
                <Download className="h-3 w-3 text-cyan-500" />
                <span>Findings CSV</span>
              </a>

              <a
                href={`/api/reports/${a.id}/download?format=json`}
                className="flex items-center gap-1.5 rounded border border-border bg-muted/80 px-3 py-1.5 text-xs text-foreground hover:bg-accent transition-colors"
              >
                <Download className="h-3 w-3 text-amber-500" />
                <span>JSON Export</span>
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
