import { describe, it, expect } from "vitest";
import {
  clusterDuplicates,
  evaluateFindingDeterministic,
  redactEvidence,
} from "@/lib/ai/analyzer";

describe("AI Engine, Deduplication & Triage Unit Tests", () => {
  it("redacts credentials and sensitive tokens from evidence before LLM prompt", () => {
    const rawEvidence = {
      user: "admin",
      password: "SuperSecretPassword123!",
      api_key: "ak-99218271829102",
      token: "bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      normalField: "HTTP 200 OK",
    };

    const redacted = redactEvidence(rawEvidence);
    expect(redacted.password).toBe("[REDACTED_CREDENTIAL]");
    expect(redacted.api_key).toBe("[REDACTED_CREDENTIAL]");
    expect(redacted.normalField).toBe("HTTP 200 OK");
  });

  it("detects and clusters duplicate findings sharing CVE on the same host", () => {
    const findings = [
      {
        id: "f1",
        assetId: "a1",
        assetIp: "10.0.4.15",
        title: "Spring Framework Remote Code Execution",
        description: "Spring4Shell RCE",
        cve: "CVE-2022-22965",
        severity: "critical",
      },
      {
        id: "f2",
        assetId: "a1",
        assetIp: "10.0.4.15",
        title: "Spring Core DataBinder Unauthenticated RCE",
        description: "Duplicate Spring4Shell",
        cve: "CVE-2022-22965",
        severity: "critical",
      },
      {
        id: "f3",
        assetId: "a1",
        assetIp: "10.0.4.15",
        title: "TLS 1.0 Enabled",
        description: "Legacy TLS",
        cve: "CVE-2011-3389",
        severity: "low",
      },
    ];

    const clusters = clusterDuplicates(findings);
    expect(clusters.length).toBe(1);
    expect(clusters[0].primaryFindingId).toBe("f1");
    expect(clusters[0].duplicateFindingIds).toContain("f2");
  });

  it("identifies false positive when static css stylesheet is flagged as SQLi", () => {
    const finding = {
      id: "f-fp",
      assetId: "a1",
      assetIp: "10.0.4.50",
      title: "SQL Injection in Static Resource URL Parameter",
      description: "Scanner flagged potential SQL injection on static resource",
      severity: "high",
      evidence: {
        url: "/assets/main.css?id=' OR 1=1--",
        responseCode: 404,
      },
    };

    const result = evaluateFindingDeterministic(finding);
    expect(result.classification.isFalsePositive).toBe(true);
    expect(result.classification.fpProbability).toBeGreaterThan(0.8);
    expect(result.classification.reasoning).toContain("static resource");
  });

  it("identifies sensitive remediations that require human approval", () => {
    const criticalFinding = {
      id: "f-rce",
      assetId: "a1",
      assetIp: "10.0.4.15",
      title: "Spring Framework Remote Code Execution (Spring4Shell)",
      description: "RCE in framework",
      cve: "CVE-2022-22965",
      severity: "critical",
    };

    const result = evaluateFindingDeterministic(criticalFinding);
    expect(result.remediation.isSensitive).toBe(true);
    expect(result.remediation.steps.length).toBeGreaterThan(0);
  });
});
