"use client";

import { useEffect, useState } from "react";
import { History, ShieldCheck, ShieldAlert, CheckCircle, RefreshCw, Search } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function AuditPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [verifying, setVerifying] = useState<boolean>(false);
  const [verificationResult, setVerificationResult] = useState<{
    verified: boolean;
    entriesCount?: number;
    message: string;
  } | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");

  const fetchLogs = async () => {
    try {
      const res = await fetch("/api/audit");
      const json = await res.json();
      if (json.success && json.data) {
        setLogs(json.data);
      }
    } catch (err) {
      console.error("Failed to load audit logs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleVerifyChain = async () => {
    setVerifying(true);
    setVerificationResult(null);
    try {
      const res = await fetch("/api/audit/verify");
      const json = await res.json();
      setVerificationResult({
        verified: json.verified,
        entriesCount: json.entriesCount,
        message: json.message,
      });
    } catch (err: any) {
      setVerificationResult({
        verified: false,
        message: `Verification failure: ${err.message}`,
      });
    } finally {
      setVerifying(false);
    }
  };

  const filtered = logs.filter((l) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      l.action?.toLowerCase().includes(term) ||
      l.entityType?.toLowerCase().includes(term) ||
      l.hash?.toLowerCase().includes(term) ||
      l.actorType?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground font-mono flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            <span>CRYPTOGRAPHIC AUDIT CHAIN (SHA-256)</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Immutable, append-only security ledger. Each event block hashes previous records to guarantee tamper evidence.
          </p>
        </div>

        <button
          onClick={handleVerifyChain}
          disabled={verifying}
          className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:opacity-90 shadow-xs disabled:opacity-50 transition-opacity"
        >
          {verifying ? (
            <>
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              <span>Verifying Cryptographic Chain...</span>
            </>
          ) : (
            <>
              <ShieldCheck className="h-4 w-4" />
              <span>Verify Integrity Now</span>
            </>
          )}
        </button>
      </div>

      {/* Verification Result Banner */}
      {verificationResult && (
        <div
          className={`rounded-xl border p-4 text-xs font-mono flex items-start gap-3 shadow-xs ${
            verificationResult.verified
              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
              : "border-destructive/40 bg-destructive/10 text-destructive"
          }`}
        >
          {verificationResult.verified ? (
            <CheckCircle className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
          ) : (
            <ShieldAlert className="h-5 w-5 shrink-0 text-destructive mt-0.5" />
          )}
          <div>
            <div className="font-bold uppercase">
              {verificationResult.verified
                ? "CHAIN INTEGRITY VERIFIED (NO TAMPERING DETECTED)"
                : "CRYPTOGRAPHIC INTEGRITY ALERT: TAMPERING DETECTED!"}
            </div>
            <div className="text-[11px] mt-1 text-foreground">{verificationResult.message}</div>
          </div>
        </div>
      )}

      {/* Search Filter */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Filter by action, entity type, hash, or actor..."
          className="w-full rounded border border-input bg-card pl-9 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
        />
      </div>

      {/* Audit Log Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border bg-muted/40 text-muted-foreground uppercase font-mono">
              <tr>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Actor</th>
                <th className="py-2.5 px-3">Action</th>
                <th className="py-2.5 px-3">Entity Type & ID</th>
                <th className="py-2.5 px-3">Prev Hash</th>
                <th className="py-2.5 px-3">Current Hash (SHA-256)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border font-mono text-[11px]">
              {filtered.map((log) => (
                <tr key={log.id} className="hover:bg-muted/50 transition-colors">
                  <td className="py-3 px-3 text-muted-foreground whitespace-nowrap">
                    {formatDate(log.ts)}
                  </td>
                  <td className="py-3 px-3">
                    <span className="rounded bg-muted border border-border px-1.5 py-0.5 text-foreground uppercase">
                      {log.actorType}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-semibold text-foreground">{log.action}</td>
                  <td className="py-3 px-3 text-muted-foreground">
                    <div className="text-foreground">{log.entityType}</div>
                    <div className="text-[10px] text-muted-foreground truncate max-w-xs">{log.entityId}</div>
                  </td>
                  <td className="py-3 px-3 text-muted-foreground">
                    {log.prevHash ? `${log.prevHash.slice(0, 12)}...` : "GENESIS"}
                  </td>
                  <td className="py-3 px-3 text-primary font-bold">
                    {log.hash ? `${log.hash.slice(0, 16)}...` : "HASH_ERR"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
