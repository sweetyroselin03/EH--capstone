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
        badgeClass: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30",
        indicator: "bg-red-500",
        color: "#ef4444",
      };
    case "high":
      return {
        label: "High",
        badgeClass: "bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30",
        indicator: "bg-orange-500",
        color: "#f97316",
      };
    case "medium":
      return {
        label: "Medium",
        badgeClass: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
        indicator: "bg-amber-500",
        color: "#eab308",
      };
    case "low":
      return {
        label: "Low",
        badgeClass: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30",
        indicator: "bg-blue-500",
        color: "#3b82f6",
      };
    default:
      return {
        label: "Info",
        badgeClass: "bg-muted text-muted-foreground border-border",
        indicator: "bg-muted-foreground",
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
    case "ACTIVE":
      return { label: formatted, class: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30" };
    case "FAILED":
    case "rejected":
    case "reopened":
    case "DISABLED":
      return { label: formatted, class: "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30" };
    case "AWAITING_APPROVAL":
    case "pending_approval":
    case "PENDING_APPROVAL":
      return { label: formatted, class: "bg-amber-500/15 text-amber-800 dark:text-amber-400 border-amber-500/30" };
    case "RECON":
    case "SCANNING":
    case "ANALYZING":
    case "REMEDIATING":
    case "REASSESSING":
    case "in_progress":
      return { label: formatted, class: "bg-cyan-500/15 text-cyan-700 dark:text-cyan-400 border-cyan-500/30 animate-pulse" };
    default:
      return { label: formatted, class: "bg-muted text-muted-foreground border-border" };
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
  });
}
