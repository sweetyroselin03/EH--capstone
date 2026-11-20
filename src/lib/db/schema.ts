import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  integer,
  real,
  jsonb,
  index,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const roleEnum = pgEnum("user_role", ["ADMIN", "ANALYST", "VIEWER"]);
export const modeEnum = pgEnum("assessment_mode", ["demo", "passive", "worker"]);
export const assessmentStatusEnum = pgEnum("assessment_status", [
  "DRAFT",
  "SCOPE_VALIDATED",
  "RECON",
  "SCANNING",
  "ANALYZING",
  "AWAITING_APPROVAL",
  "REMEDIATING",
  "REASSESSING",
  "COMPLETED",
  "FAILED",
  "CANCELLED",
]);
export const targetTypeEnum = pgEnum("target_type", ["domain", "ip", "cidr", "url"]);
export const exposureEnum = pgEnum("asset_exposure", ["internet", "internal"]);
export const sourceEnum = pgEnum("finding_source", ["nmap", "openvas", "zap", "passive", "demo"]);
export const severityEnum = pgEnum("finding_severity", ["info", "low", "medium", "high", "critical"]);
export const findingStatusEnum = pgEnum("finding_status", [
  "open",
  "false_positive",
  "accepted",
  "remediating",
  "resolved",
  "reopened",
]);
export const remediationTypeEnum = pgEnum("remediation_type", [
  "patch",
  "config",
  "disable_service",
  "other",
]);
export const remediationStatusEnum = pgEnum("remediation_status", [
  "proposed",
  "pending_approval",
  "approved",
  "rejected",
  "in_progress",
  "done",
  "verified",
]);
export const approvalDecisionEnum = pgEnum("approval_decision", ["approved", "rejected"]);
export const jobStatusEnum = pgEnum("job_status", ["queued", "running", "done", "failed"]);
export const actorTypeEnum = pgEnum("actor_type", ["user", "system", "worker", "ai"]);

// 1. Users
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("ANALYST"), // ADMIN, ANALYST, VIEWER
  status: text("status").notNull().default("PENDING_APPROVAL"), // ACTIVE, PENDING_APPROVAL, DISABLED
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// 1b. User Invites (one-time token expiring in 48h)
export const invites = pgTable(
  "invites",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: text("email").notNull(),
    role: text("role").notNull().default("ANALYST"), // ADMIN, ANALYST, VIEWER
    tokenHash: text("token_hash").notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdBy: uuid("created_by").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_invites_email").on(table.email),
    index("idx_invites_token").on(table.tokenHash),
  ]
);

// 1c. Password Reset Tokens (one-time token expiring in 1h)
export const passwordResetTokens = pgTable(
  "password_reset_tokens",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
    tokenHash: text("token_hash").notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_reset_token").on(table.tokenHash),
    index("idx_reset_user").on(table.userId),
  ]
);

// 2. Assessments
export const assessments = pgTable(
  "assessments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    ownerId: uuid("owner_id").references(() => users.id),
    status: text("status").notNull().default("DRAFT"),
    mode: text("mode").notNull().default("demo"), // demo, passive, worker
    rulesOfEngagement: text("rules_of_engagement").notNull().default("Standard non-destructive assessment."),
    authorizationConfirmed: boolean("authorization_confirmed").notNull().default(false),
    authorizationNote: text("authorization_note"),
    startedAt: timestamp("started_at", { withTimezone: true }),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_assessments_owner").on(table.ownerId),
    index("idx_assessments_status").on(table.status),
  ]
);

// 3. Scope Targets
export const scopeTargets = pgTable(
  "scope_targets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    assessmentId: uuid("assessment_id").references(() => assessments.id, { onDelete: "cascade" }).notNull(),
    type: text("type").notNull().default("domain"), // domain, ip, cidr, url
    value: text("value").notNull(),
    criticality: integer("criticality").notNull().default(3), // 1 - 5
    verified: boolean("verified").notNull().default(false),
    excluded: boolean("excluded").notNull().default(false),
  },
  (table) => [
    index("idx_scope_assessment").on(table.assessmentId),
  ]
);

// 4. Assets
export const assets = pgTable(
  "assets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    assessmentId: uuid("assessment_id").references(() => assessments.id, { onDelete: "cascade" }).notNull(),
    hostname: text("hostname"),
    ip: text("ip").notNull(),
    osGuess: text("os_guess"),
    criticality: integer("criticality").notNull().default(3),
    exposure: text("exposure").notNull().default("internet"), // internet, internal
  },
  (table) => [
    index("idx_assets_assessment").on(table.assessmentId),
  ]
);

// 5. Services
export const services = pgTable(
  "services",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    assetId: uuid("asset_id").references(() => assets.id, { onDelete: "cascade" }).notNull(),
    port: integer("port").notNull(),
    protocol: text("protocol").notNull().default("tcp"),
    name: text("name").notNull(),
    product: text("product"),
    version: text("version"),
  },
  (table) => [
    index("idx_services_asset").on(table.assetId),
  ]
);

// 6. Findings
export const findings = pgTable(
  "findings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    assessmentId: uuid("assessment_id").references(() => assessments.id, { onDelete: "cascade" }).notNull(),
    assetId: uuid("asset_id").references(() => assets.id, { onDelete: "cascade" }).notNull(),
    serviceId: uuid("service_id").references(() => services.id, { onDelete: "set null" }),
    source: text("source").notNull().default("demo"), // nmap, openvas, zap, passive, demo
    sourceId: text("source_id"),
    title: text("title").notNull(),
    description: text("description").notNull(),
    cwe: text("cwe"),
    cve: text("cve"),
    cvss: real("cvss").default(0),
    severity: text("severity").notNull().default("medium"), // info, low, medium, high, critical
    evidence: jsonb("evidence").default({}),
    status: text("status").notNull().default("open"), // open, false_positive, accepted, remediating, resolved, reopened
    duplicateOf: uuid("duplicate_of"),
    fpProbability: real("fp_probability").default(0),
    aiConfidence: real("ai_confidence").default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_findings_assessment").on(table.assessmentId),
    index("idx_findings_asset").on(table.assetId),
    index("idx_findings_severity").on(table.severity),
    index("idx_findings_status").on(table.status),
    index("idx_findings_compound").on(table.assessmentId, table.severity, table.status),
  ]
);

// 7. Risk Scores
export const riskScores = pgTable(
  "risk_scores",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    findingId: uuid("finding_id").references(() => findings.id, { onDelete: "cascade" }).notNull().unique(),
    score: real("score").notNull().default(0), // 0 - 100
    severityComponent: real("severity_component").notNull().default(0),
    exposureComponent: real("exposure_component").notNull().default(0),
    criticalityComponent: real("criticality_component").notNull().default(0),
    rank: integer("rank").notNull().default(1),
    explanation: text("explanation").notNull(),
  },
  (table) => [
    index("idx_risk_finding").on(table.findingId),
    index("idx_risk_score").on(table.score),
  ]
);

// 8. Remediations
export const remediations = pgTable(
  "remediations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    findingId: uuid("finding_id").references(() => findings.id, { onDelete: "cascade" }).notNull(),
    title: text("title").notNull(),
    steps: jsonb("steps").notNull().default([]),
    actionType: text("action_type").notNull().default("patch"), // patch, config, disable_service, other
    isSensitive: boolean("is_sensitive").notNull().default(false),
    status: text("status").notNull().default("proposed"), // proposed, pending_approval, approved, rejected, in_progress, done, verified
    assignedTo: uuid("assigned_to").references(() => users.id),
  },
  (table) => [
    index("idx_remediations_finding").on(table.findingId),
    index("idx_remediations_status").on(table.status),
  ]
);

// 9. Approvals
export const approvals = pgTable(
  "approvals",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    remediationId: uuid("remediation_id").references(() => remediations.id, { onDelete: "cascade" }).notNull(),
    requestedAt: timestamp("requested_at", { withTimezone: true }).defaultNow().notNull(),
    decidedBy: uuid("decided_by").references(() => users.id),
    decision: text("decision"), // approved, rejected
    reason: text("reason"),
    decidedAt: timestamp("decided_at", { withTimezone: true }),
  },
  (table) => [
    index("idx_approvals_remediation").on(table.remediationId),
  ]
);

// 10. Jobs (queue for step execution)
export const jobs = pgTable(
  "jobs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    assessmentId: uuid("assessment_id").references(() => assessments.id, { onDelete: "cascade" }).notNull(),
    step: text("step").notNull(), // validate_scope, recon, scan, analyze, remediate, reassess
    status: text("status").notNull().default("queued"), // queued, running, done, failed
    payload: jsonb("payload").default({}),
    result: jsonb("result").default({}),
    attempts: integer("attempts").notNull().default(0),
    lockedBy: text("locked_by"),
    lockedAt: timestamp("locked_at", { withTimezone: true }),
    error: text("error"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_jobs_assessment").on(table.assessmentId),
    index("idx_jobs_status").on(table.status),
  ]
);

// 11. Reports
export const reports = pgTable(
  "reports",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    assessmentId: uuid("assessment_id").references(() => assessments.id, { onDelete: "cascade" }).notNull(),
    version: integer("version").notNull().default(1),
    format: text("format").notNull().default("json"), // pdf, csv, json
    storageRef: text("storage_ref"),
    generatedBy: uuid("generated_by").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_reports_assessment").on(table.assessmentId),
  ]
);

// 12. Audit Logs (SHA-256 Hash Chain)
export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ts: timestamp("ts", { withTimezone: true }).defaultNow().notNull(),
    actorId: uuid("actor_id"),
    actorType: text("actor_type").notNull().default("system"), // user, system, worker, ai
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id").notNull(),
    details: jsonb("details").default({}),
    ip: text("ip").default("127.0.0.1"),
    prevHash: text("prev_hash").notNull().default("GENESIS_BLOCK_HASH"),
    hash: text("hash").notNull(),
  },
  (table) => [
    index("idx_audit_entity").on(table.entityType, table.entityId),
    index("idx_audit_ts").on(table.ts),
  ]
);

// 13. Alerts
export const alerts = pgTable(
  "alerts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    assessmentId: uuid("assessment_id").references(() => assessments.id, { onDelete: "cascade" }).notNull(),
    findingId: uuid("finding_id").references(() => findings.id, { onDelete: "cascade" }),
    severity: text("severity").notNull(),
    message: text("message").notNull(),
    read: boolean("read").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_alerts_assessment").on(table.assessmentId),
    index("idx_alerts_read").on(table.read),
  ]
);

// 14. System Settings
export const systemSettings = pgTable("system_settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Relations
export const assessmentsRelations = relations(assessments, ({ one, many }) => ({
  owner: one(users, { fields: [assessments.ownerId], references: [users.id] }),
  scopeTargets: many(scopeTargets),
  assets: many(assets),
  findings: many(findings),
  jobs: many(jobs),
  reports: many(reports),
  alerts: many(alerts),
}));

export const assetsRelations = relations(assets, ({ one, many }) => ({
  assessment: one(assessments, { fields: [assets.assessmentId], references: [assessments.id] }),
  services: many(services),
  findings: many(findings),
}));

export const servicesRelations = relations(services, ({ one, many }) => ({
  asset: one(assets, { fields: [services.assetId], references: [assets.id] }),
  findings: many(findings),
}));

export const findingsRelations = relations(findings, ({ one, many }) => ({
  assessment: one(assessments, { fields: [findings.assessmentId], references: [assessments.id] }),
  asset: one(assets, { fields: [findings.assetId], references: [assets.id] }),
  service: one(services, { fields: [findings.serviceId], references: [services.id] }),
  riskScore: one(riskScores, { fields: [findings.id], references: [riskScores.findingId] }),
  remediations: many(remediations),
}));

export const remediationsRelations = relations(remediations, ({ one, many }) => ({
  finding: one(findings, { fields: [remediations.findingId], references: [findings.id] }),
  approvals: many(approvals),
  assignee: one(users, { fields: [remediations.assignedTo], references: [users.id] }),
}));
