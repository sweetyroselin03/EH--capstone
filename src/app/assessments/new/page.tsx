"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Target,
  ShieldCheck,
  Plus,
  Trash2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Check,
  Info,
  Server,
  Zap,
} from "lucide-react";

interface TargetItem {
  id: string;
  type: "domain" | "ip" | "cidr" | "url";
  value: string;
  criticality: number;
  excluded: boolean;
}

export default function NewAssessmentWizard() {
  const router = useRouter();
  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState<string>("Infrastructure Security Assessment");
  const [mode, setMode] = useState<"demo" | "passive" | "worker">("demo");
  const [rulesOfEngagement, setRulesOfEngagement] = useState<string>(
    "Authorized ethical penetration testing only. Strict non-destructive testing methodology. No distributed denial-of-service, no social engineering, no unauthorized exfiltration."
  );
  const [authorizationConfirmed, setAuthorizationConfirmed] = useState<boolean>(false);
  const [authorizationNote, setAuthorizationNote] = useState<string>(
    "Executive sign-off from IT Security Director (Authorized Lab Environment ref: ITA1405-2026)."
  );
  const [targets, setTargets] = useState<TargetItem[]>([
    {
      id: "1",
      type: "domain",
      value: "demo.authorized-lab.local",
      criticality: 5,
      excluded: false,
    },
    {
      id: "2",
      type: "cidr",
      value: "10.0.4.0/24",
      criticality: 4,
      excluded: false,
    },
  ]);

  const addTarget = () => {
    setTargets([
      ...targets,
      {
        id: crypto.randomUUID(),
        type: "domain",
        value: "",
        criticality: 3,
        excluded: false,
      },
    ]);
  };

  const removeTarget = (id: string) => {
    if (targets.length === 1) return;
    setTargets(targets.filter((t) => t.id !== id));
  };

  const updateTarget = (id: string, updates: Partial<TargetItem>) => {
    setTargets(targets.map((t) => (t.id === id ? { ...t, ...updates } : t)));
  };

  const handleSubmit = async () => {
    setError(null);
    if (!authorizationConfirmed) {
      setError("Authorization Gate: You must confirm written authorization to test targets.");
      return;
    }

    if (targets.some((t) => !t.value.trim())) {
      setError("All target entries must contain a valid domain, IP, or CIDR value.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/assessments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          mode,
          rulesOfEngagement,
          authorizationConfirmed,
          authorizationNote,
          targets: targets.map(({ type, value, criticality, excluded }) => ({
            type,
            value: value.trim(),
            criticality,
            excluded,
          })),
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(typeof json.error === "string" ? json.error : "Failed to create assessment");
      }

      router.push(`/assessments/${json.data.id}`);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Wizard Step Indicator */}
      <div className="border-b border-border pb-5">
        <h1 className="text-xl font-bold tracking-tight text-foreground font-mono flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          <span>NEW ASSESSMENT WIZARD</span>
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Configure authorized scope targets, rules of engagement, and autonomous scanning mode
        </p>

        <div className="grid grid-cols-4 gap-2 mt-6">
          {[
            { num: 1, title: "Scope Targets" },
            { num: 2, title: "Rules of Engagement" },
            { num: 3, title: "Authorization Gate" },
            { num: 4, title: "Scan Mode & Launch" },
          ].map((s) => (
            <div
              key={s.num}
              className={`rounded border p-2 text-xs transition-colors ${
                step === s.num
                  ? "border-primary bg-primary/10 text-primary font-bold shadow-xs"
                  : step > s.num
                  ? "border-border bg-card text-foreground"
                  : "border-border/60 bg-muted/40 text-muted-foreground"
              }`}
            >
              <div className="font-mono text-[10px] text-muted-foreground">STEP {s.num}</div>
              <div className="font-medium truncate">{s.title}</div>
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <div>{error}</div>
        </div>
      )}

      {/* STEP 1: Scope Targets */}
      {step === 1 && (
        <div className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-xs">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">Assessment Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded border border-input bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
            />
          </div>

          <div className="border-t border-border pt-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-xs font-semibold text-foreground">Authorized Scope Boundaries</h3>
                <p className="text-[11px] text-muted-foreground">
                  Every scan action will strictly assert candidate targets against these rules
                </p>
              </div>
              <button
                type="button"
                onClick={addTarget}
                className="flex items-center gap-1 rounded border border-border bg-muted/60 px-2.5 py-1 text-xs text-foreground hover:bg-muted"
              >
                <Plus className="h-3 w-3" />
                <span>Add Target</span>
              </button>
            </div>

            <div className="space-y-2">
              {targets.map((t) => (
                <div
                  key={t.id}
                  className="flex flex-col sm:flex-row items-center gap-2 rounded border border-border bg-muted/30 p-2.5"
                >
                  <select
                    value={t.type}
                    onChange={(e) => updateTarget(t.id, { type: e.target.value as any })}
                    className="rounded border border-input bg-background px-2 py-1.5 text-xs text-foreground font-mono"
                  >
                    <option value="domain">Domain / Host</option>
                    <option value="ip">IPv4 Address</option>
                    <option value="cidr">CIDR Subnet</option>
                    <option value="url">Web URL</option>
                  </select>

                  <input
                    type="text"
                    value={t.value}
                    onChange={(e) => updateTarget(t.id, { value: e.target.value })}
                    placeholder="e.g. demo.lab.local, 10.0.4.0/24"
                    className="flex-1 rounded border border-input bg-background px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground font-mono"
                  />

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-muted-foreground">Criticality:</span>
                    <select
                      value={t.criticality}
                      onChange={(e) => updateTarget(t.id, { criticality: parseInt(e.target.value, 10) })}
                      className="rounded border border-input bg-background px-2 py-1.5 text-xs text-foreground"
                    >
                      <option value={1}>1 - Low</option>
                      <option value={2}>2 - Minor</option>
                      <option value={3}>3 - Standard</option>
                      <option value={4}>4 - High</option>
                      <option value={5}>5 - Mission Critical</option>
                    </select>

                    <label className="flex items-center gap-1 text-[11px] text-muted-foreground cursor-pointer">
                      <input
                        type="checkbox"
                        checked={t.excluded}
                        onChange={(e) => updateTarget(t.id, { excluded: e.target.checked })}
                        className="rounded border-input text-primary"
                      />
                      <span>Exclude</span>
                    </label>

                    <button
                      type="button"
                      onClick={() => removeTarget(t.id)}
                      className="text-muted-foreground hover:text-destructive p-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: Rules of Engagement */}
      {step === 2 && (
        <div className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-xs">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Rules of Engagement (ROE)</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Specify non-intrusive constraints, testing time windows, and prohibited exploitation techniques.
            </p>
          </div>

          <textarea
            value={rulesOfEngagement}
            onChange={(e) => setRulesOfEngagement(e.target.value)}
            rows={5}
            className="w-full rounded border border-input bg-background p-3 text-xs text-foreground font-mono focus:border-primary focus:outline-none"
          />

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="rounded border border-border bg-muted/40 p-3">
              <div className="text-xs font-semibold text-foreground">Rate Limiting Guarantee</div>
              <div className="text-[11px] text-muted-foreground mt-1">
                Passive and worker scanners enforce max 5 requests/sec to prevent service disruptions.
              </div>
            </div>
            <div className="rounded border border-border bg-muted/40 p-3">
              <div className="text-xs font-semibold text-foreground">No Payload Weaponization</div>
              <div className="text-[11px] text-muted-foreground mt-1">
                Zero exploit delivery. Detection, identification, and configuration auditing only.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: Authorization Gate */}
      {step === 3 && (
        <div className="space-y-5 rounded-xl border border-border bg-card p-6 shadow-xs">
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-700 dark:text-amber-400 space-y-2">
            <div className="flex items-center gap-2 font-bold uppercase font-mono">
              <ShieldCheck className="h-4 w-4" />
              <span>Mandatory Legal Authorization Gate</span>
            </div>
            <p>
              Penetration testing without prior explicit written consent is illegal under computer misuse statutes.
              You must possess verifiable authorization for all defined scope targets before this workflow can start.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground">Written Authorization Reference Note</label>
            <input
              type="text"
              value={authorizationNote}
              onChange={(e) => setAuthorizationNote(e.target.value)}
              placeholder="e.g. Signed contract reference, CISO authorization memo number"
              className="w-full rounded border border-input bg-background px-3 py-2 text-xs text-foreground font-mono focus:border-primary focus:outline-none"
            />
          </div>

          <div className="rounded border border-border bg-muted/40 p-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={authorizationConfirmed}
                onChange={(e) => setAuthorizationConfirmed(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-input text-primary"
              />
              <span className="text-xs text-foreground">
                <strong>I hereby certify that I am legally authorized</strong> to conduct ethical penetration testing
                and vulnerability assessments against the listed targets within the specified rules of engagement.
              </span>
            </label>
          </div>

          <div className="rounded border border-border bg-muted/40 p-3 text-[11px] text-muted-foreground">
            <div className="font-semibold text-foreground mb-1 flex items-center gap-1.5">
              <Info className="h-3.5 w-3.5 text-cyan-500" />
              <span>Passive Mode Ownership Verification Notice:</span>
            </div>
            When using Web Passive mode on live domains, the system validates DNS TXT records or a token file at{" "}
            <code className="text-primary font-bold">/.well-known/aeha-verify.txt</code> before scanning.
          </div>
        </div>
      )}

      {/* STEP 4: Scan Mode Selection */}
      {step === 4 && (
        <div className="space-y-5 rounded-xl border border-border bg-card p-6 shadow-xs">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Select Penetration Testing Engine Mode</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Choose execution environment adapter</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              {
                id: "demo",
                title: "Safe Demo Mode",
                badge: "DEFAULT / VERCEL",
                icon: Zap,
                desc: "Runs simulated realistic enterprise assets, open ports, Log4j/Spring4Shell CVEs, duplicate probes, and false positives for AI triage.",
              },
              {
                id: "passive",
                title: "Web Passive Scanner",
                badge: "SAFE LIVE WEB",
                icon: ShieldCheck,
                desc: "Non-intrusive live HTTP checks: missing security headers, weak TLS, insecure cookie flags, server banner disclosure. Strictly no port scanning.",
              },
              {
                id: "worker",
                title: "Real Scanner Worker",
                badge: "ISOLATED LAB",
                icon: Server,
                desc: "Dispatches jobs to external Kali/Docker scanner worker daemon running real Nmap and OWASP ZAP within an authorized lab subnet.",
              },
            ].map((opt) => {
              const Icon = opt.icon;
              return (
                <div
                  key={opt.id}
                  onClick={() => setMode(opt.id as any)}
                  className={`cursor-pointer rounded-lg border p-4 transition-all flex flex-col justify-between ${
                    mode === opt.id
                      ? "border-primary bg-primary/10 shadow-xs"
                      : "border-border bg-card hover:border-primary/50"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Icon className={`h-5 w-5 ${mode === opt.id ? "text-primary" : "text-muted-foreground"}`} />
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                        {opt.badge}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-foreground">{opt.title}</div>
                    <div className="text-[11px] text-muted-foreground mt-1">{opt.desc}</div>
                  </div>
                  {mode === opt.id && (
                    <div className="mt-3 text-[11px] font-semibold text-primary flex items-center gap-1 font-mono">
                      <Check className="h-3 w-3" /> Selected Engine
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Navigation Footer */}
      <div className="flex items-center justify-between border-t border-border pt-4">
        {step > 1 ? (
          <button
            type="button"
            onClick={() => setStep(step - 1)}
            className="flex items-center gap-1.5 rounded border border-border bg-card px-3 py-1.5 text-xs text-foreground hover:bg-muted"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Previous Step</span>
          </button>
        ) : (
          <div />
        )}

        {step < 4 ? (
          <button
            type="button"
            onClick={() => {
              setError(null);
              setStep(step + 1);
            }}
            className="flex items-center gap-1.5 rounded bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90 shadow-xs"
          >
            <span>Continue</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        ) : (
          <button
            type="button"
            disabled={loading || !authorizationConfirmed}
            onClick={handleSubmit}
            className="flex items-center gap-1.5 rounded bg-primary px-5 py-2 text-xs font-bold text-primary-foreground hover:opacity-90 disabled:opacity-50 shadow-md"
          >
            {loading ? (
              <span>Initializing State Machine...</span>
            ) : (
              <>
                <ShieldCheck className="h-4 w-4" />
                <span>Launch Assessment Workflow</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
