import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatSeverity(severity: string) {
  const s = severity?.toLowerCase() || "info";
  switch (s) {
    case "critical":
      return {
        label: "Critical",
        badgeClass: "bg-red-500/10 text-red-500 border-red-500/30",
        indicator: "bg-red-500",
        color: "#ef4444",
      };
    case "high":
      return {
        label: "High",
        badgeClass: "bg-orange-500/10 text-orange-500 border-orange-500/30",
        indicator: "bg-orange-500",
        color: "#f97316",
      };
    case "medium":
      return {
        label: "Medium",
        badgeClass: "bg-amber-500/10 text-amber-500 border-amber-500/30",
        indicator: "bg-amber-500",
        color: "#eab308",
      };
    case "low":
      return {
        label: "Low",
        badgeClass: "bg-blue-500/10 text-blue-500 border-blue-500/30",
        indicator: "bg-blue-500",
        color: "#3b82f6",
      };
    default:
      return {
        label: "Info",
        badgeClass: "bg-zinc-500/10 text-zinc-400 border-zinc-500/30",
        indicator: "bg-zinc-400",
        color: "#9ca3af",
      };
  }
}

export function formatStatus(status: string) {
  const formatted = status.replace(/_/g, " ").toUpperCase();
  switch (status) {
    case "COMPLETED":
    case "verified":
    case "resolved":
    case "approved":
      return { label: formatted, class: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" };
    case "FAILED":
    case "rejected":
    case "reopened":
      return { label: formatted, class: "bg-red-500/10 text-red-400 border-red-500/30" };
    case "AWAITING_APPROVAL":
    case "pending_approval":
      return { label: formatted, class: "bg-amber-500/10 text-amber-400 border-amber-500/30" };
    case "RECON":
    case "SCANNING":
    case "ANALYZING":
    case "REMEDIATING":
    case "REASSESSING":
    case "in_progress":
      return { label: formatted, class: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30 animate-pulse" };
    default:
      return { label: formatted, class: "bg-zinc-500/10 text-zinc-300 border-zinc-700" };
  }
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "N/A";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}
