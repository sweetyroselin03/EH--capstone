import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!process.env.DATABASE_URL) {
      // Fallback response for offline demo
      return NextResponse.json({
        success: true,
        data: {
          assessment: {
            id,
            name: "Autonomous Infrastructure Threat Modeling & Pentest",
            status: "AWAITING_APPROVAL",
            mode: "demo",
            rulesOfEngagement: "Authorized testing only.",
            authorizationConfirmed: true,
          },
          targets: [
            { id: "t1", type: "domain", value: "demo.authorized-lab.local", criticality: 5, verified: true },
          ],
          assets: [
            { id: "a1", ip: "10.0.4.15", hostname: "api.demo.authorized-lab.local", criticality: 5, exposure: "internet", services: [{ port: 8080, name: "http-alt", product: "Tomcat/Spring" }] },
            { id: "a2", ip: "10.0.4.22", hostname: "auth.demo.authorized-lab.local", criticality: 4, exposure: "internet", services: [{ port: 5432, name: "postgresql", product: "PostgreSQL" }] },
          ],
          findings: [
            {
              id: "f1",
              title: "Spring Framework Remote Code Execution (Spring4Shell)",
              severity: "critical",
              cvss: 9.8,
              status: "open",
              cve: "CVE-2022-22965",
              cwe: "CWE-94",
              riskScore: { score: 98, rank: 1, explanation: "Critical severity on internet-exposed tier 5 asset." },
              remediation: { id: "r1", title: "Upgrade Spring Framework", actionType: "patch", isSensitive: true, status: "pending_approval" },
            },
            {
              id: "f2",
              title: "PostgreSQL Database Exposed without Mandatory SSL",
              severity: "high",
              cvss: 7.5,
              status: "open",
              riskScore: { score: 82, rank: 2, explanation: "High exposure on credentials port." },
              remediation: { id: "r2", title: "Enforce TLS in PostgreSQL", actionType: "config", isSensitive: true, status: "pending_approval" },
            },
            {
              id: "f3",
              title: "SQL Injection in Static Resource URL Parameter",
              severity: "high",
              cvss: 8.5,
              status: "false_positive",
              fpProbability: 0.94,
              aiConfidence: 0.96,
            },
          ],
          approvals: [
            { id: "app1", remediationId: "r1", title: "Upgrade Spring Framework", isSensitive: true },
            { id: "app2", remediationId: "r2", title: "Enforce TLS in PostgreSQL", isSensitive: true },
          ],
        },
      });
    }

    const assessmentRes = await db
      .select()
      .from(schema.assessments)
      .where(eq(schema.assessments.id, id));

    if (assessmentRes.length === 0) {
      return NextResponse.json({ success: false, error: "Assessment not found" }, { status: 404 });
    }

    const assessment = assessmentRes[0];
    const targets = await db
      .select()
      .from(schema.scopeTargets)
      .where(eq(schema.scopeTargets.assessmentId, id));

    const assets = await db
      .select()
      .from(schema.assets)
      .where(eq(schema.assets.assessmentId, id));

    const findings = await db
      .select()
      .from(schema.findings)
      .where(eq(schema.findings.assessmentId, id));

    // Fetch risk scores and remediations for findings
    const findingsWithDetails = await Promise.all(
      findings.map(async (f) => {
        const [risk] = await db
          .select()
          .from(schema.riskScores)
          .where(eq(schema.riskScores.findingId, f.id));
        const [rem] = await db
          .select()
          .from(schema.remediations)
          .where(eq(schema.remediations.findingId, f.id));
        return {
          ...f,
          riskScore: risk || null,
          remediation: rem || null,
        };
      })
    );

    // Fetch pending approvals
    const allRemediations = findingsWithDetails
      .map((f) => f.remediation)
      .filter((r) => r && r.isSensitive);

    const pendingApprovals = await Promise.all(
      allRemediations.map(async (rem: any) => {
        const [app] = await db
          .select()
          .from(schema.approvals)
          .where(eq(schema.approvals.remediationId, rem.id));
        return {
          id: app?.id || rem.id,
          remediationId: rem.id,
          title: rem.title,
          isSensitive: rem.isSensitive,
          status: rem.status,
          decision: app?.decision || null,
          reason: app?.reason || null,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        assessment,
        targets,
        assets,
        findings: findingsWithDetails,
        approvals: pendingApprovals,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
