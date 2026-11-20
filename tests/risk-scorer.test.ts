import { describe, it, expect } from "vitest";
import {
  computeRiskScore,
  rankFindings,
  DEFAULT_RISK_WEIGHTS,
} from "@/lib/risk/scorer";

describe("Risk Scorer & Prioritization Algorithm", () => {
  it("calculates high risk score for critical internet-exposed finding on Tier 5 asset", () => {
    const result = computeRiskScore({
      cvss: 9.8,
      severity: "critical",
      exposure: "internet",
      assetCriticality: 5,
    });

    // Severity: 98 * 0.5 = 49
    // Exposure: 100 * 0.25 = 25
    // Criticality: 100 * 0.25 = 25
    // Total = 99
    expect(result.score).toBeGreaterThanOrEqual(95);
    expect(result.explanation).toContain("Risk score of");
    expect(result.explanation.toLowerCase()).toContain("internet");
    expect(result.severityComponent).toBe(98);
  });

  it("reduces score for internal low-criticality asset with same vulnerability", () => {
    const criticalInternet = computeRiskScore({
      cvss: 9.8,
      severity: "critical",
      exposure: "internet",
      assetCriticality: 5,
    });

    const criticalInternal = computeRiskScore({
      cvss: 9.8,
      severity: "critical",
      exposure: "internal",
      assetCriticality: 1,
    });

    expect(criticalInternet.score).toBeGreaterThan(criticalInternal.score);
  });

  it("respects dynamic weight configuration", () => {
    const customWeights = {
      severityWeight: 0.8,
      exposureWeight: 0.1,
      criticalityWeight: 0.1,
    };

    const result = computeRiskScore(
      {
        cvss: 10.0,
        severity: "critical",
        exposure: "internal",
        assetCriticality: 1,
      },
      customWeights
    );

    // 100 * 0.8 + 40 * 0.1 + 20 * 0.1 = 80 + 4 + 2 = 86
    expect(result.score).toBe(86);
  });

  it("correctly ranks findings descending by score", () => {
    const findings = [
      { id: "1", riskScore: { score: 45 } },
      { id: "2", riskScore: { score: 98 } },
      { id: "3", riskScore: { score: 72 } },
    ];

    const ranked = rankFindings(findings);
    expect(ranked[0].id).toBe("2");
    expect(ranked[0].rank).toBe(1);
    expect(ranked[1].id).toBe("3");
    expect(ranked[1].rank).toBe(2);
    expect(ranked[2].id).toBe("1");
    expect(ranked[2].rank).toBe(3);
  });
});
