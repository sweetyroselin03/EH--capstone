import "dotenv/config";
import { db, schema } from "./index";
import { hashPassword } from "../auth";
import { computeAuditHash, GENESIS_HASH } from "../audit/hasher";
import { computeRiskScore } from "../risk/scorer";

export async function runSeed() {
  console.log("🌱 Starting AEHA database seeding...");

  if (!process.env.DATABASE_URL) {
    console.warn("⚠️ DATABASE_URL not set. Skipping live DB seed (demo mock data is active).");
    return;
  }

  try {
    // 1. Clean existing tables if needed or insert fresh
    const adminPasswordHash = hashPassword(process.env.ADMIN_PASSWORD || "AdminSecurePassword123!");
    const analystPasswordHash = hashPassword(process.env.ANALYST_PASSWORD || "AnalystSecurePassword123!");

    // Seed Users
    const [adminUser] = await db
      .insert(schema.users)
      .values({
        name: "Lead Security Administrator",
        email: (process.env.ADMIN_EMAIL || "admin@aeha.local").toLowerCase(),
        passwordHash: adminPasswordHash,
        role: "ADMIN",
      })
      .onConflictDoNothing()
      .returning();

    const [analystUser] = await db
      .insert(schema.users)
      .values({
        name: "SOC Senior Analyst",
        email: (process.env.ANALYST_EMAIL || "analyst@aeha.local").toLowerCase(),
        passwordHash: analystPasswordHash,
        role: "ANALYST",
      })
      .onConflictDoNothing()
      .returning();

    const adminId = adminUser?.id;
    const analystId = analystUser?.id;

    // 2. Assessment 1: Completed FinTech Assessment
    const [assessment1] = await db
      .insert(schema.assessments)
      .values({
        name: "Q1 FinTech Core Banking Perimeter Audit",
        ownerId: adminId,
        status: "COMPLETED",
        mode: "demo",
        rulesOfEngagement: "Authorized red-team non-intrusive scan within maintenance window. No denial-of-service.",
        authorizationConfirmed: true,
        authorizationNote: "Executive sign-off by CISO per memo SEC-2026-081.",
        startedAt: new Date(Date.now() - 7 * 24 * 3600 * 1000),
        finishedAt: new Date(Date.now() - 6 * 24 * 3600 * 1000),
      })
      .returning();

    // Scope for Assessment 1
    await db.insert(schema.scopeTargets).values([
      {
        assessmentId: assessment1.id,
        type: "domain",
        value: "api.ebank-fintech.internal",
        criticality: 5,
        verified: true,
        excluded: false,
      },
      {
        assessmentId: assessment1.id,
        type: "cidr",
        value: "10.20.1.0/24",
        criticality: 4,
        verified: true,
        excluded: false,
      },
    ]);

    // Assets for Assessment 1
    const [ast1] = await db
      .insert(schema.assets)
      .values({
        assessmentId: assessment1.id,
        hostname: "api.ebank-fintech.internal",
        ip: "10.20.1.15",
        osGuess: "Ubuntu 22.04 LTS (Kernel 5.15)",
        criticality: 5,
        exposure: "internet",
      })
      .returning();

    const [srv1] = await db
      .insert(schema.services)
      .values({
        assetId: ast1.id,
        port: 8080,
        protocol: "tcp",
        name: "http-alt",
        product: "Spring Boot Web MVC",
        version: "2.6.3",
      })
      .returning();

    // 3. Assessment 2: Completed Healthcare Passive Assessment
    const [assessment2] = await db
      .insert(schema.assessments)
      .values({
        name: "Healthcare Patient Portal Passive Audit",
        ownerId: analystId,
        status: "COMPLETED",
        mode: "passive",
        rulesOfEngagement: "Strictly passive HTTP inspection. No active payloads or port scanning.",
        authorizationConfirmed: true,
        authorizationNote: "Authorized by Hospital Compliance Directorate.",
        startedAt: new Date(Date.now() - 3 * 24 * 3600 * 1000),
        finishedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000),
      })
      .returning();

    // 4. Assessment 3: Active In-Progress Assessment (AWAITING_APPROVAL)
    const [assessment3] = await db
      .insert(schema.assessments)
      .values({
        name: "Autonomous Infrastructure Threat Modeling & Pentest",
        ownerId: adminId,
        status: "AWAITING_APPROVAL",
        mode: "demo",
        rulesOfEngagement: "Full autonomous audit with AI risk prioritization and mandatory human approval gates.",
        authorizationConfirmed: true,
        authorizationNote: "Signed authorization letter ref: SEC-CAMPUS-ITA1405-AUTH.",
        startedAt: new Date(Date.now() - 2 * 3600 * 1000),
      })
      .returning();

    await db.insert(schema.scopeTargets).values([
      {
        assessmentId: assessment3.id,
        type: "domain",
        value: "demo.authorized-lab.local",
        criticality: 5,
        verified: true,
        excluded: false,
      },
      {
        assessmentId: assessment3.id,
        type: "cidr",
        value: "10.0.4.0/24",
        criticality: 4,
        verified: true,
        excluded: false,
      },
    ]);

    // Discovered Assets for Assessment 3
    const [ast3A] = await db
      .insert(schema.assets)
      .values({
        assessmentId: assessment3.id,
        hostname: "api.demo.authorized-lab.local",
        ip: "10.0.4.15",
        osGuess: "Ubuntu 22.04 LTS (Linux 5.15)",
        criticality: 5,
        exposure: "internet",
      })
      .returning();

    const [srv3A] = await db
      .insert(schema.services)
      .values({
        assetId: ast3A.id,
        port: 8080,
        protocol: "tcp",
        name: "http-alt",
        product: "Apache Tomcat / Spring",
        version: "9.0.58",
      })
      .returning();

    const [ast3B] = await db
      .insert(schema.assets)
      .values({
        assessmentId: assessment3.id,
        hostname: "auth.demo.authorized-lab.local",
        ip: "10.0.4.22",
        osGuess: "Debian 11 (Linux 5.10)",
        criticality: 4,
        exposure: "internet",
      })
      .returning();

    const [srv3B] = await db
      .insert(schema.services)
      .values({
        assetId: ast3B.id,
        port: 5432,
        protocol: "tcp",
        name: "postgresql",
        product: "PostgreSQL Database",
        version: "13.4",
      })
      .returning();

    // Findings for Assessment 3
    // Finding 1: Spring4Shell (Critical)
    const [f1] = await db
      .insert(schema.findings)
      .values({
        assessmentId: assessment3.id,
        assetId: ast3A.id,
        serviceId: srv3A.id,
        source: "demo",
        sourceId: "DEMO-RCE-001",
        title: "Spring Framework Remote Code Execution (Spring4Shell)",
        description: "A Spring MVC application running on JDK 9+ allows remote code execution via DataBinder parameter binding.",
        cwe: "CWE-94",
        cve: "CVE-2022-22965",
        cvss: 9.8,
        severity: "critical",
        status: "open",
        fpProbability: 0.02,
        aiConfidence: 0.98,
        evidence: {
          endpoint: "http://10.0.4.15:8080/helloworld/greeting",
          param: "class.module.classLoader.resources.context.parent.pipeline.first.pattern",
          responseCode: 200,
        },
      })
      .returning();

    const risk1 = computeRiskScore({ cvss: 9.8, severity: "critical", exposure: "internet", assetCriticality: 5 });
    await db.insert(schema.riskScores).values({
      findingId: f1.id,
      score: risk1.score,
      severityComponent: risk1.severityComponent,
      exposureComponent: risk1.exposureComponent,
      criticalityComponent: risk1.criticalityComponent,
      rank: 1,
      explanation: risk1.explanation,
    });

    const [rem1] = await db
      .insert(schema.remediations)
      .values({
        findingId: f1.id,
        title: "Upgrade Spring Framework and JDK Runtime",
        actionType: "patch",
        isSensitive: true,
        status: "pending_approval",
        steps: [
          "Upgrade Spring Framework dependency to 5.3.18+ in pom.xml.",
          "Upgrade underlying Java runtime to OpenJDK 17.0.3+.",
          "Re-compile and verify Tomcat DataBinder disallows disallowedFields binding patterns.",
        ],
      })
      .returning();

    // Sensitive approval requirement
    await db.insert(schema.approvals).values({
      remediationId: rem1.id,
    });

    // Finding 2: Duplicate of Spring4Shell
    const [f2] = await db
      .insert(schema.findings)
      .values({
        assessmentId: assessment3.id,
        assetId: ast3A.id,
        serviceId: srv3A.id,
        source: "demo",
        sourceId: "DEMO-RCE-001-DUP",
        title: "Spring Core DataBinder Unauthenticated RCE",
        description: "Duplicate detection candidate: Identical vulnerability CVE-2022-22965 discovered via secondary probe.",
        cwe: "CWE-94",
        cve: "CVE-2022-22965",
        cvss: 9.8,
        severity: "critical",
        status: "false_positive",
        duplicateOf: f1.id,
        fpProbability: 0.05,
        aiConfidence: 0.95,
        evidence: { duplicateOf: f1.id },
      })
      .returning();

    // Finding 3: PostgreSQL Unencrypted
    const [f3] = await db
      .insert(schema.findings)
      .values({
        assessmentId: assessment3.id,
        assetId: ast3B.id,
        serviceId: srv3B.id,
        source: "demo",
        sourceId: "DEMO-DB-003",
        title: "PostgreSQL Database Exposed without Mandatory SSL",
        description: "PostgreSQL listens on port 5432 without requiring SSL transport encryption, exposing credentials.",
        cwe: "CWE-319",
        cvss: 7.5,
        severity: "high",
        status: "open",
        fpProbability: 0.04,
        aiConfidence: 0.94,
        evidence: { sslRequired: false },
      })
      .returning();

    const risk3 = computeRiskScore({ cvss: 7.5, severity: "high", exposure: "internet", assetCriticality: 4 });
    await db.insert(schema.riskScores).values({
      findingId: f3.id,
      score: risk3.score,
      severityComponent: risk3.severityComponent,
      exposureComponent: risk3.exposureComponent,
      criticalityComponent: risk3.criticalityComponent,
      rank: 2,
      explanation: risk3.explanation,
    });

    const [rem3] = await db
      .insert(schema.remediations)
      .values({
        findingId: f3.id,
        title: "Enforce TLS in PostgreSQL and Restrict pg_hba.conf",
        actionType: "config",
        isSensitive: true,
        status: "pending_approval",
        steps: [
          "Enable ssl = on in postgresql.conf.",
          "Modify pg_hba.conf to enforce hostssl method for all remote connections.",
          "Reload PostgreSQL service configuration.",
        ],
      })
      .returning();

    await db.insert(schema.approvals).values({
      remediationId: rem3.id,
    });

    // Finding 4: False Positive on static resource
    await db.insert(schema.findings).values({
      assessmentId: assessment3.id,
      assetId: ast3A.id,
      source: "demo",
      sourceId: "DEMO-FP-007",
      title: "SQL Injection in Static Resource URL Parameter",
      description: "Scanner flagged potential SQL injection based on generic 404 response on /assets/main.css?id=1",
      cwe: "CWE-89",
      cvss: 8.5,
      severity: "high",
      status: "false_positive",
      fpProbability: 0.94,
      aiConfidence: 0.96,
      evidence: { url: "/assets/main.css", responseCode: 404 },
    });

    // 5. Seed SHA-256 Audit Chain
    let lastHash = GENESIS_HASH;
    const auditEvents = [
      {
        action: "USER_LOGIN_SUCCESS",
        entityType: "user",
        entityId: adminId || "system",
        actorType: "user" as const,
        details: { email: "admin@aeha.local", ip: "192.168.1.100" },
      },
      {
        action: "CREATE_ASSESSMENT",
        entityType: "assessment",
        entityId: assessment3.id,
        actorType: "user" as const,
        details: { name: assessment3.name, mode: "demo" },
      },
      {
        action: "VALIDATE_SCOPE",
        entityType: "assessment",
        entityId: assessment3.id,
        actorType: "system" as const,
        details: { targetsCount: 2, status: "SCOPE_VALIDATED" },
      },
      {
        action: "RECON_DISCOVERY",
        entityType: "assessment",
        entityId: assessment3.id,
        actorType: "system" as const,
        details: { discoveredAssetsCount: 2, openPorts: [8080, 5432] },
      },
      {
        action: "VULNERABILITY_SCAN",
        entityType: "assessment",
        entityId: assessment3.id,
        actorType: "system" as const,
        details: { rawFindingsIdentified: 4 },
      },
      {
        action: "AI_TRIAGE_AND_RISK_SCORING",
        entityType: "assessment",
        entityId: assessment3.id,
        actorType: "ai" as const,
        details: {
          duplicatesRemoved: 1,
          falsePositivesClassified: 1,
          sensitiveRemediationsQueued: 2,
        },
      },
      {
        action: "APPROVAL_REQUESTED",
        entityType: "remediation",
        entityId: rem1.id,
        actorType: "system" as const,
        details: { title: rem1.title, isSensitive: true },
      },
    ];

    for (let i = 0; i < auditEvents.length; i++) {
      const evt = auditEvents[i];
      const ts = new Date(Date.now() - (auditEvents.length - i) * 15 * 60 * 1000);
      const hash = computeAuditHash(
        {
          ts,
          actorId: adminId,
          actorType: evt.actorType,
          action: evt.action,
          entityType: evt.entityType,
          entityId: evt.entityId,
          details: evt.details,
          ip: "192.168.1.100",
        },
        lastHash
      );

      await db.insert(schema.auditLogs).values({
        ts,
        actorId: adminId,
        actorType: evt.actorType,
        action: evt.action,
        entityType: evt.entityType,
        entityId: evt.entityId,
        details: evt.details,
        ip: "192.168.1.100",
        prevHash: lastHash,
        hash,
      });

      lastHash = hash;
    }

    console.log("✅ AEHA database successfully seeded with demo assessments, findings, and audit chain!");
  } catch (err) {
    console.error("❌ Seeding error:", err);
  }
}

if (process.argv[1]?.includes("seed.ts")) {
  runSeed().then(() => process.exit(0));
}
