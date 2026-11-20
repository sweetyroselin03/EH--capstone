import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { logAuditEvent } from "@/lib/audit/logger";

export async function POST(req: NextRequest) {
  const token = req.headers.get("x-worker-token") || req.headers.get("authorization")?.replace("Bearer ", "");
  const expectedToken = process.env.WORKER_TOKEN || "aeha-worker-secret-token-9988";

  if (token !== expectedToken) {
    return NextResponse.json({ error: "Unauthorized worker access" }, { status: 401 });
  }

  const signature = req.headers.get("x-worker-signature");
  const rawBody = await req.text();

  // Validate HMAC signature if secret is provided
  const hmacSecret = process.env.WORKER_HMAC_SECRET || "aeha-worker-hmac-sha256-signing-secret";
  const expectedSig = createHmac("sha256", hmacSecret).update(rawBody).digest("hex");

  if (signature && signature !== expectedSig) {
    return NextResponse.json({ error: "Invalid worker HMAC signature" }, { status: 403 });
  }

  try {
    const data = JSON.parse(rawBody);
    const { jobId, assessmentId, findings, assets } = data;

    if (process.env.DATABASE_URL) {
      if (jobId) {
        await db
          .update(schema.jobs)
          .set({ status: "done", result: data })
          .where(eq(schema.jobs.id, jobId));
      }

      // Ingest worker findings
      if (findings && Array.isArray(findings)) {
        for (const f of findings) {
          await db.insert(schema.findings).values({
            assessmentId,
            assetId: f.assetId,
            source: f.source || "nmap",
            title: f.title,
            description: f.description,
            cwe: f.cwe,
            cve: f.cve,
            cvss: f.cvss || 0,
            severity: f.severity || "medium",
            evidence: f.evidence || {},
            status: "open",
          });
        }
      }
    }

    await logAuditEvent({
      actorType: "worker",
      action: "WORKER_RESULTS_RECEIVED",
      entityType: "job",
      entityId: jobId || "worker-submission",
      details: {
        assessmentId,
        findingsCount: findings?.length || 0,
        assetsCount: assets?.length || 0,
      },
    });

    return NextResponse.json({ success: true, message: "Worker scan results processed successfully." });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
