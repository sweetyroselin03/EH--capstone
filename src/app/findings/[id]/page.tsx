"use client";

import { use } from "react";
import Link from "next/link";
import { ShieldAlert, ArrowLeft, Bug, Sparkles, CheckCircle2, AlertTriangle } from "lucide-react";
import { formatSeverity } from "@/lib/utils";

export default function FindingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  // Demo finding data
  const finding = {
    id,
    title: "Spring Framework Remote Code Execution (Spring4Shell)",
    severity: "critical",
    cvss: 9.8,
    cve: "CVE-2022-22965",
    cwe: "CWE-94: Improper Control of Generation of Code ('Code Injection')",
    status: "open",
    description:
      "A Spring MVC or Spring WebFlux application running on JDK 9+ may be vulnerable to remote code execution (RCE) via data binding. The vulnerability allows an attacker to pass parameters to the DataBinder mechanism that access the ClassLoader and rewrite access log configurations into malicious JSP web shells.",
    evidence: {
      endpoint: "http://10.0.4.15:8080/helloworld/greeting",
      parameter: "class.module.classLoader.resources.context.parent.pipeline.first.pattern",
      responseCode: 200,
      banner: "Apache Tomcat/9.0.58",
      sanitized: true,
    },
    riskScore: {
      score: 98,
      rank: 1,
      explanation:
        "Risk score 98/100: Critical severity CVSS 9.8 vulnerability directly exposed to the public Internet on a mission-critical Tier 5 API gateway asset.",
    },
    remediation: {
      title: "Upgrade Spring Framework and JDK Runtime",
      actionType: "patch",
      isSensitive: true,
      steps: [
        "Upgrade Spring Framework dependency to 5.3.18+ or 5.2.20+ in build.gradle / pom.xml.",
        "Upgrade underlying Java runtime to OpenJDK 11.0.15+ or 17.0.3+.",
        "Re-compile the application artifact and run regression test suite in staging.",
        "Deploy artifact and verify Tomcat DataBinder disallows disallowedFields binding patterns.",
      ],
    },
  };

  const sevFmt = formatSeverity(finding.severity);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <Link
        href="/assessments"
        className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-emerald-400 transition-colors font-mono"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        <span>Back to Assessments</span>
      </Link>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase ${sevFmt.badgeClass}`}>
                {sevFmt.label}
              </span>
              <span className="font-mono text-xs text-zinc-400">CVSS: {finding.cvss}</span>
              <span className="font-mono text-xs text-emerald-400 font-bold">{finding.cve}</span>
            </div>
            <h1 className="text-lg font-bold text-zinc-100">{finding.title}</h1>
          </div>

          <div className="text-right">
            <span className="text-xs font-mono text-zinc-400">Priority Score:</span>
            <div className="text-2xl font-bold font-mono text-emerald-400">
              {finding.riskScore.score}/100
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-xs font-bold text-zinc-300 uppercase font-mono">Vulnerability Description</h3>
          <p className="text-xs text-zinc-300 leading-relaxed font-sans">{finding.description}</p>
          <div className="text-[11px] font-mono text-zinc-400">{finding.cwe}</div>
        </div>

        <div className="space-y-2 border-t border-zinc-800 pt-4">
          <h3 className="text-xs font-bold text-zinc-300 uppercase font-mono flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-emerald-400" />
            <span>AI Risk Explanation & Impact Rationale</span>
          </h3>
          <div className="rounded border border-zinc-800 bg-zinc-950 p-3 text-xs text-zinc-300">
            {finding.riskScore.explanation}
          </div>
        </div>

        <div className="space-y-2 border-t border-zinc-800 pt-4">
          <h3 className="text-xs font-bold text-zinc-300 uppercase font-mono">Sanitized Evidence Payload</h3>
          <pre className="rounded border border-zinc-800 bg-zinc-950 p-3 font-mono text-[11px] text-emerald-300 overflow-x-auto">
            {JSON.stringify(finding.evidence, null, 2)}
          </pre>
        </div>

        <div className="space-y-2 border-t border-zinc-800 pt-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-zinc-300 uppercase font-mono">Actionable Remediation Plan</h3>
            {finding.remediation.isSensitive && (
              <span className="rounded bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 text-[10px] font-mono text-amber-400 font-bold">
                HUMAN APPROVAL MANDATORY
              </span>
            )}
          </div>
          <div className="rounded border border-zinc-800 bg-zinc-950 p-4 space-y-2">
            <div className="text-xs font-bold text-zinc-200">{finding.remediation.title}</div>
            <ol className="list-decimal list-inside space-y-1 font-mono text-[11px] text-zinc-400">
              {finding.remediation.steps.map((st, i) => (
                <li key={i}>{st}</li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
