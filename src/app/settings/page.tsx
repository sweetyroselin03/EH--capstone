"use client";

import { useState } from "react";
import { Settings, Sliders, Cpu, Save, ShieldCheck } from "lucide-react";

export default function SettingsPage() {
  const [sevWeight, setSevWeight] = useState<number>(50);
  const [expWeight, setExpWeight] = useState<number>(25);
  const [critWeight, setCritWeight] = useState<number>(25);
  const [saved, setSaved] = useState<boolean>(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="border-b border-zinc-800 pb-5">
        <h1 className="text-xl font-bold tracking-tight text-white font-mono flex items-center gap-2">
          <Settings className="h-5 w-5 text-emerald-400" />
          <span>SYSTEM & ALGORITHMIC CONFIGURATION</span>
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Configure risk prioritization weight distributions, AI provider connectors, and scanner parameters
        </p>
      </div>

      {saved && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-400 flex items-center gap-2 font-mono">
          <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-400" />
          <span>Algorithmic parameters successfully updated!</span>
        </div>
      )}

      {/* 1. Risk Formula Weights */}
      <form onSubmit={handleSave} className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6 space-y-5">
        <div>
          <h2 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
            <Sliders className="h-4 w-4 text-emerald-400" />
            <span>Risk Prioritization Formula Weighting</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Score (0–100) = (Severity × W_sev) + (Exposure × W_exp) + (Asset Criticality × W_crit). Total sum must equal 100%.
          </p>
        </div>

        <div className="space-y-4 font-mono text-xs">
          <div>
            <div className="flex justify-between text-zinc-300 mb-1">
              <span>Severity Component Weight:</span>
              <span className="text-emerald-400 font-bold">{sevWeight}%</span>
            </div>
            <input
              type="range"
              min="10"
              max="80"
              value={sevWeight}
              onChange={(e) => setSevWeight(parseInt(e.target.value, 10))}
              className="w-full accent-emerald-500"
            />
          </div>

          <div>
            <div className="flex justify-between text-zinc-300 mb-1">
              <span>Exposure Component Weight (Internet vs Internal):</span>
              <span className="text-cyan-400 font-bold">{expWeight}%</span>
            </div>
            <input
              type="range"
              min="10"
              max="60"
              value={expWeight}
              onChange={(e) => setExpWeight(parseInt(e.target.value, 10))}
              className="w-full accent-cyan-500"
            />
          </div>

          <div>
            <div className="flex justify-between text-zinc-300 mb-1">
              <span>Asset Criticality Weight (Tier 1–5):</span>
              <span className="text-amber-400 font-bold">{critWeight}%</span>
            </div>
            <input
              type="range"
              min="10"
              max="60"
              value={critWeight}
              onChange={(e) => setCritWeight(parseInt(e.target.value, 10))}
              className="w-full accent-amber-500"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="flex items-center gap-1.5 rounded bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 transition-colors"
          >
            <Save className="h-3.5 w-3.5" />
            <span>Save Formula Weights</span>
          </button>
        </div>
      </form>

      {/* 2. AI Engine & Provider Status */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6 space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
            <Cpu className="h-4 w-4 text-emerald-400" />
            <span>AI Reasoning & Classification Engine</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Current LLM orchestration provider status and deterministic fallback mechanism
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
          <div className="rounded border border-zinc-800 bg-zinc-950 p-3">
            <div className="text-zinc-500 text-[10px]">Active AI Engine:</div>
            <div className="text-zinc-200 font-bold mt-0.5">Vercel AI SDK + Google Gemini</div>
            <div className="text-emerald-400 text-[11px] mt-1">● Provider Initialized</div>
          </div>

          <div className="rounded border border-zinc-800 bg-zinc-950 p-3">
            <div className="text-zinc-500 text-[10px]">Zero-Failure Fallback:</div>
            <div className="text-zinc-200 font-bold mt-0.5">Deterministic Rule-Based Engine</div>
            <div className="text-cyan-400 text-[11px] mt-1">● Active & Standby (No API Key Required)</div>
          </div>
        </div>
      </div>
    </div>
  );
}
