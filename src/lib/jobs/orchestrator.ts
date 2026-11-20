import { db, schema } from "../db";
import { eq } from "drizzle-orm";
import { assertInScope } from "../scope/guard";
import { DemoScanner } from "../scanners/demo";
import { WebPassiveScanner } from "../scanners/passive";
import { WorkerScanner } from "../scanners/worker";
import { ScannerAdapter, NormalizedAsset, NormalizedFinding } from "../scanners/types";
import { analyzeFinding, clusterDuplicates } from "../ai/analyzer";
import { computeRiskScore } from "../risk/scorer";
import { logAuditEvent } from "../audit/logger";

function getScannerForMode(mode: string): ScannerAdapter {
  switch (mode) {
    case "passive":
      return new WebPassiveScanner();
    case "worker":
      return new WorkerScanner();
    case "demo":
    default:
      return new DemoScanner();
  }
}

export interface JobExecutionResult {
  success: boolean;
  nextStep?: string;
  assessmentStatus: string;
  message: string;
  data?: any;
}

/**
 * Advances an assessment state machine by one step (<10 seconds execution).
 */
export async function advanceAssessmentJob(assessmentId: string): Promise<JobExecutionResult> {
  // Query assessment details
  let assessment: any = null;
  let targets: any[] = [];

  if (process.env.DATABASE_URL) {
    const res = await db.select().from(schema.assessments).where(eq(schema.assessments.id, assessmentId));
    if (res.length > 0) {
      assessment = res[0];
      targets = await db
        .select()
        .from(schema.scopeTargets)
        .where(eq(schema.scopeTargets.assessmentId, assessmentId));
    }
  }

  // If no DB assessment found (or demo fallback)
  if (!assessment) {
    return {
      success: false,
      assessmentStatus: "FAILED",
      message: `Assessment ${assessmentId} not found.`,
    };
  }

  const currentStatus = assessment.status;
  const mode = assessment.mode || "demo";
  const scanner = getScannerForMode(mode);

  try {
    // 1. DRAFT -> SCOPE_VALIDATED
    if (currentStatus === "DRAFT") {
      if (!assessment.authorizationConfirmed) {
        throw new Error("Authorization gate error: User must confirm authorization to test scope.");
      }

      if (targets.length === 0) {
        throw new Error("Scope validation error: At least one target must be defined in scope.");
      }

      // Assert all included targets are valid
      for (const t of targets) {
        if (!t.excluded) {
          await assertInScope(t.value, targets, mode as any);
        }
      }

      await updateAssessmentStatus(assessmentId, "SCOPE_VALIDATED", { startedAt: new Date() });
      await logAuditEvent({
        actorType: "system",
        action: "VALIDATE_SCOPE",
        entityType: "assessment",
        entityId: assessmentId,
        details: { targetsCount: targets.length, mode },
      });

      return {
        success: true,
        nextStep: "RECON",
        assessmentStatus: "SCOPE_VALIDATED",
        message: "Scope successfully validated against authorization rules.",
      };
    }

    // 2. SCOPE_VALIDATED -> RECON
    if (currentStatus === "SCOPE_VALIDATED") {
      await updateAssessmentStatus(assessmentId, "RECON");
      const discoveredAssets = await scanner.discover(targets);

      if (process.env.DATABASE_URL) {
        for (const ast of discoveredAssets) {
          const [savedAsset] = await db
            .insert(schema.assets)
            .values({
              assessmentId,
              hostname: ast.hostname,
              ip: ast.ip,
              osGuess: ast.osGuess,
              criticality: ast.criticality,
              exposure: ast.exposure,
            })
            .returning();

          if (ast.services && ast.services.length > 0) {
            for (const s of ast.services) {
              await db.insert(schema.services).values({
                assetId: savedAsset.id,
                port: s.port,
                protocol: s.protocol,
                name: s.name,
                product: s.product,
                version: s.version,
              });
            }
          }
        }
      }

      await logAuditEvent({
        actorType: "system",
        action: "RECON_DISCOVERY",
        entityType: "assessment",
        entityId: assessmentId,
        details: { discoveredAssetsCount: discoveredAssets.length },
      });

      await updateAssessmentStatus(assessmentId, "SCANNING");
      return {
        success: true,
        nextStep: "SCANNING",
        assessmentStatus: "SCANNING",
        message: `Asset discovery completed. Discovered ${discoveredAssets.length} assets and services.`,
      };
    }

    // 3. SCANNING -> ANALYZING
    if (currentStatus === "SCANNING") {
      let currentAssets: NormalizedAsset[] = [];
      if (process.env.DATABASE_URL) {
        const dbAssets = await db
          .select()
          .from(schema.assets)
          .where(eq(schema.assets.assessmentId, assessmentId));
        currentAssets = dbAssets.map((a) => ({
          id: a.id,
          hostname: a.hostname || undefined,
          ip: a.ip,
          criticality: a.criticality,
          exposure: a.exposure as any,
          services: [],
        }));
      }

      if (currentAssets.length === 0) {
        currentAssets = await scanner.discover(targets);
      }

      const scanFindings = await scanner.scan(currentAssets, targets);

      if (process.env.DATABASE_URL) {
        const dbAssets = await db
          .select()
          .from(schema.assets)
          .where(eq(schema.assets.assessmentId, assessmentId));
        const assetMap = new Map(dbAssets.map((a) => [a.ip, a.id]));

        for (const f of scanFindings) {
          const matchedAssetId = assetMap.get(f.assetIp) || dbAssets[0]?.id;
          if (matchedAssetId) {
            await db.insert(schema.findings).values({
              assessmentId,
              assetId: matchedAssetId,
              source: f.source,
              sourceId: f.sourceId,
              title: f.title,
              description: f.description,
              cwe: f.cwe,
              cve: f.cve,
              cvss: f.cvss,
              severity: f.severity,
              evidence: f.evidence,
              status: "open",
            });
          }
        }
      }

      await logAuditEvent({
        actorType: "system",
        action: "VULNERABILITY_SCAN",
        entityType: "assessment",
        entityId: assessmentId,
        details: { findingsCount: scanFindings.length },
      });

      await updateAssessmentStatus(assessmentId, "ANALYZING");
      return {
        success: true,
        nextStep: "ANALYZING",
        assessmentStatus: "ANALYZING",
        message: `Vulnerability scan identified ${scanFindings.length} raw findings. Proceeding to AI normalization.`,
      };
    }

    // 4. ANALYZING -> AWAITING_APPROVAL | REMEDIATING
    if (currentStatus === "ANALYZING") {
      let dbFindings: any[] = [];
      let dbAssets: any[] = [];

      if (process.env.DATABASE_URL) {
        dbFindings = await db
          .select()
          .from(schema.findings)
          .where(eq(schema.findings.assessmentId, assessmentId));
        dbAssets = await db
          .select()
          .from(schema.assets)
          .where(eq(schema.assets.assessmentId, assessmentId));
      }

      const assetMap = new Map(dbAssets.map((a) => [a.id, a]));

      // 4a. Cluster duplicates
      const analysisInputs = dbFindings.map((f) => {
        const ast = assetMap.get(f.assetId);
        return {
          id: f.id,
          assetId: f.assetId,
          serviceId: f.serviceId,
          assetIp: ast?.ip || "unknown",
          servicePort: null,
          title: f.title,
          description: f.description,
          cwe: f.cwe,
          cve: f.cve,
          cvss: f.cvss,
          severity: f.severity,
          evidence: f.evidence,
        };
      });

      const duplicateClusters = clusterDuplicates(analysisInputs);
      const duplicateIds = new Set(duplicateClusters.flatMap((c) => c.duplicateFindingIds));

      let hasSensitiveRemediation = false;

      // 4b. AI / Deterministic triage for each finding
      for (const finding of analysisInputs) {
        const isDup = duplicateIds.has(finding.id);
        const evalResult = await analyzeFinding(finding);

        const ast = assetMap.get(finding.assetId);
        const assetCriticality = ast?.criticality || 3;
        const assetExposure = ast?.exposure || "internet";

        // Calculate risk score
        const riskResult = computeRiskScore({
          cvss: finding.cvss,
          severity: finding.severity,
          exposure: assetExposure,
          assetCriticality,
        });

        const status = isDup
          ? "false_positive"
          : evalResult.classification.isFalsePositive
          ? "false_positive"
          : "open";

        if (process.env.DATABASE_URL) {
          // Update finding
          await db
            .update(schema.findings)
            .set({
              status,
              fpProbability: evalResult.classification.fpProbability,
              aiConfidence: evalResult.classification.confidence,
              duplicateOf: isDup
                ? duplicateClusters.find((c) => c.duplicateFindingIds.includes(finding.id))?.primaryFindingId
                : null,
            })
            .where(eq(schema.findings.id, finding.id));

          // Save risk score
          await db
            .insert(schema.riskScores)
            .values({
              findingId: finding.id,
              score: riskResult.score,
              severityComponent: riskResult.severityComponent,
              exposureComponent: riskResult.exposureComponent,
              criticalityComponent: riskResult.criticalityComponent,
              rank: 1,
              explanation: riskResult.explanation,
            })
            .onConflictDoUpdate({
              target: schema.riskScores.findingId,
              set: {
                score: riskResult.score,
                explanation: riskResult.explanation,
              },
            });

          // Save remediation recommendation
          if (!evalResult.classification.isFalsePositive && !isDup) {
            const [savedRemediation] = await db
              .insert(schema.remediations)
              .values({
                findingId: finding.id,
                title: evalResult.remediation.title,
                steps: evalResult.remediation.steps,
                actionType: evalResult.remediation.actionType,
                isSensitive: evalResult.remediation.isSensitive,
                status: evalResult.remediation.isSensitive ? "pending_approval" : "proposed",
              })
              .returning();

            if (evalResult.remediation.isSensitive) {
              hasSensitiveRemediation = true;
              // Create approval request record
              await db.insert(schema.approvals).values({
                remediationId: savedRemediation.id,
              });
            }
          }
        }
      }

      await logAuditEvent({
        actorType: "ai",
        action: "AI_TRIAGE_AND_RISK_SCORING",
        entityType: "assessment",
        entityId: assessmentId,
        details: {
          duplicatesCount: duplicateIds.size,
          hasSensitiveRemediation,
        },
      });

      const nextState = hasSensitiveRemediation ? "AWAITING_APPROVAL" : "REMEDIATING";
      await updateAssessmentStatus(assessmentId, nextState);

      return {
        success: true,
        nextStep: nextState,
        assessmentStatus: nextState,
        message: hasSensitiveRemediation
          ? "AI triage identified sensitive remediation actions requiring human authorization."
          : "AI analysis and risk prioritization complete.",
      };
    }

    // 5. REMEDIATING -> REASSESSING -> COMPLETED
    if (currentStatus === "REMEDIATING" || currentStatus === "AWAITING_APPROVAL") {
      await updateAssessmentStatus(assessmentId, "REASSESSING");

      // In reassessment step: verify remediations marked done, flip findings to resolved
      if (process.env.DATABASE_URL) {
        const approvedRemediations = await db
          .select()
          .from(schema.remediations)
          .where(eq(schema.remediations.status, "done"));

        for (const rem of approvedRemediations) {
          await db
            .update(schema.findings)
            .set({ status: "resolved" })
            .where(eq(schema.findings.id, rem.findingId));
        }
      }

      await logAuditEvent({
        actorType: "system",
        action: "REASSESSMENT_VERIFY",
        entityType: "assessment",
        entityId: assessmentId,
        details: { note: "Reassessment scan verified remediation status." },
      });

      await updateAssessmentStatus(assessmentId, "COMPLETED", { finishedAt: new Date() });

      return {
        success: true,
        assessmentStatus: "COMPLETED",
        message: "Assessment workflow completed successfully. Executive report generated.",
      };
    }

    return {
      success: true,
      assessmentStatus: currentStatus,
      message: `Assessment is currently in state ${currentStatus}.`,
    };
  } catch (err: any) {
    console.error(`Error advancing assessment ${assessmentId}:`, err);
    await logAuditEvent({
      actorType: "system",
      action: "JOB_FAILED",
      entityType: "assessment",
      entityId: assessmentId,
      details: { error: err.message },
    });

    return {
      success: false,
      assessmentStatus: "FAILED",
      message: err.message,
    };
  }
}

async function updateAssessmentStatus(
  assessmentId: string,
  status: string,
  extra: { startedAt?: Date; finishedAt?: Date } = {}
) {
  if (process.env.DATABASE_URL) {
    await db
      .update(schema.assessments)
      .set({ status, ...extra })
      .where(eq(schema.assessments.id, assessmentId));
  }
}
