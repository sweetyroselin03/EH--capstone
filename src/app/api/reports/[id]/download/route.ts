import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import {
  generateReportJSON,
  generateReportCSV,
  generateExecutiveHTML,
  ReportData,
} from "@/lib/reports/generator";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const format = (searchParams.get("format") || "json").toLowerCase();

    let assessment: any = null;
    let targets: any[] = [];
    let assets: any[] = [];
    let findings: any[] = [];

    if (process.env.DATABASE_URL) {
      const assRes = await db
        .select()
        .from(schema.assessments)
        .where(eq(schema.assessments.id, id));

      if (assRes.length > 0) {
        assessment = assRes[0];
        targets = await db
          .select()
          .from(schema.scopeTargets)
          .where(eq(schema.scopeTargets.assessmentId, id));
        assets = await db
          .select()
          .from(schema.assets)
          .where(eq(schema.assets.assessmentId, id));
        findings = await db
          .select()
          .from(schema.findings)
          .where(eq(schema.findings.assessmentId, id));
      }
    }

    if (!assessment) {
      assessment = {
        id,
        name: "Autonomous Infrastructure Threat Modeling & Pentest",
        status: "COMPLETED",
        mode: "demo",
        rulesOfEngagement: "Authorized testing only.",
        authorizationConfirmed: true,
        authorizationNote: "Authorized by Lab Director per ref ITA1405-DEMO.",
        startedAt: new Date(Date.now() - 3600000).toISOString(),
        finishedAt: new Date().toISOString(),
      };
      targets = [
        { type: "domain", value: "demo.authorized-lab.local", criticality: 5, verified: true, excluded: false },
      ];
      assets = [
        { ip: "10.0.4.15", hostname: "api.demo.authorized-lab.local", criticality: 5, exposure: "internet", servicesCount: 3 },
        { ip: "10.0.4.22", hostname: "auth.demo.authorized-lab.local", criticality: 4, exposure: "internet", servicesCount: 2 },
      ];
      findings = [
        {
          id: "f1",
          title: "Spring Framework Remote Code Execution (Spring4Shell)",
          severity: "critical",
          cvss: 9.8,
          riskScore: 98,
          status: "open",
          cve: "CVE-2022-22965",
          cwe: "CWE-94",
          description: "Spring MVC data binder parameter binding vulnerability.",
          remediationTitle: "Upgrade Spring Framework and JDK Runtime",
        },
        {
          id: "f2",
          title: "PostgreSQL Database Exposed without Mandatory SSL",
          severity: "high",
          cvss: 7.5,
          riskScore: 82,
          status: "open",
          cwe: "CWE-319",
          description: "Unencrypted database port.",
          remediationTitle: "Enforce TLS in PostgreSQL",
        },
      ];
    }

    const totalFindings = findings.length;
    const critical = findings.filter((f) => f.severity === "critical").length;
    const high = findings.filter((f) => f.severity === "high").length;
    const medium = findings.filter((f) => f.severity === "medium").length;
    const low = findings.filter((f) => f.severity === "low").length;
    const info = findings.filter((f) => f.severity === "info").length;
    const resolved = findings.filter((f) => f.status === "resolved").length;
    const open = findings.filter((f) => f.status === "open").length;
    const falsePositive = findings.filter((f) => f.status === "false_positive").length;

    const reportData: ReportData = {
      assessment,
      scope: targets,
      assets: assets.map((a) => ({
        ...a,
        servicesCount: a.servicesCount || 2,
      })),
      findings,
      summary: {
        totalFindings,
        critical,
        high,
        medium,
        low,
        info,
        resolved,
        open,
        falsePositive,
        overallRiskScore: critical > 0 ? 94 : high > 0 ? 78 : 45,
      },
    };

    if (format === "csv") {
      const csv = generateReportCSV(reportData);
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="aeha-report-${id}.csv"`,
        },
      });
    }

    if (format === "html" || format === "pdf") {
      const html = generateExecutiveHTML(reportData);
      return new NextResponse(html, {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Content-Disposition": `inline; filename="aeha-executive-report-${id}.html"`,
        },
      });
    }

    // Default JSON format
    const json = generateReportJSON(reportData);
    return new NextResponse(json, {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="aeha-report-${id}.json"`,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
