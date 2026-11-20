export interface RiskWeights {
  severityWeight: number; // default 0.50
  exposureWeight: number; // default 0.25
  criticalityWeight: number; // default 0.25
}

export const DEFAULT_RISK_WEIGHTS: RiskWeights = {
  severityWeight: 0.50,
  exposureWeight: 0.25,
  criticalityWeight: 0.25,
};

export interface RiskInput {
  cvss?: number | null;
  severity: "critical" | "high" | "medium" | "low" | "info" | string;
  exposure: "internet" | "internal" | string;
  assetCriticality: number; // 1 to 5
}

export interface RiskCalculationResult {
  score: number; // 0 to 100
  severityComponent: number;
  exposureComponent: number;
  criticalityComponent: number;
  explanation: string;
}

export function calculateSeverityComponent(
  severity: string,
  cvss?: number | null
): number {
  if (typeof cvss === "number" && cvss > 0) {
    return Math.min(100, Math.max(0, cvss * 10));
  }

  const s = severity?.toLowerCase() || "medium";
  switch (s) {
    case "critical":
      return 95;
    case "high":
      return 75;
    case "medium":
      return 50;
    case "low":
      return 25;
    case "info":
    default:
      return 10;
  }
}

export function calculateExposureComponent(exposure: string): number {
  const exp = exposure?.toLowerCase() || "internal";
  return exp === "internet" ? 100 : 40;
}

export function calculateCriticalityComponent(criticality: number): number {
  const c = Math.max(1, Math.min(5, criticality || 3));
  return (c / 5) * 100;
}

export function computeRiskScore(
  input: RiskInput,
  weights: RiskWeights = DEFAULT_RISK_WEIGHTS
): RiskCalculationResult {
  const sevComp = calculateSeverityComponent(input.severity, input.cvss);
  const expComp = calculateExposureComponent(input.exposure);
  const critComp = calculateCriticalityComponent(input.assetCriticality);

  const rawScore =
    sevComp * weights.severityWeight +
    expComp * weights.exposureWeight +
    critComp * weights.criticalityWeight;

  const score = Math.min(100, Math.max(0, Math.round(rawScore)));

  // Generate plain-English explanation
  const cvssMention = input.cvss ? `CVSS score of ${input.cvss}` : `${input.severity.toUpperCase()} severity`;
  const exposureDesc =
    input.exposure === "internet"
      ? "is exposed directly to the public Internet"
      : "resides in an internal/segmented zone";
  const critDesc = `asset criticality level ${input.assetCriticality}/5`;

  const explanation =
    `Risk score of ${score}/100 derived from ${cvssMention} (${sevComp.toFixed(0)} pts weighted at ${(weights.severityWeight * 100).toFixed(0)}%), ` +
    `amplified because the asset ${exposureDesc} (${expComp.toFixed(0)} pts weighted at ${(weights.exposureWeight * 100).toFixed(0)}%), ` +
    `and evaluated against business impact on an asset with ${critDesc} (${critComp.toFixed(0)} pts weighted at ${(weights.criticalityWeight * 100).toFixed(0)}%).`;

  return {
    score,
    severityComponent: Number(sevComp.toFixed(1)),
    exposureComponent: Number(expComp.toFixed(1)),
    criticalityComponent: Number(critComp.toFixed(1)),
    explanation,
  };
}

export function rankFindings<T extends { riskScore?: { score: number } | null; cvss?: number | null }>(
  findings: T[]
): (T & { rank: number })[] {
  return [...findings]
    .sort((a, b) => {
      const scoreA = a.riskScore?.score ?? (a.cvss ? a.cvss * 10 : 0);
      const scoreB = b.riskScore?.score ?? (b.cvss ? b.cvss * 10 : 0);
      return scoreB - scoreA;
    })
    .map((item, index) => ({
      ...item,
      rank: index + 1,
    }));
}
