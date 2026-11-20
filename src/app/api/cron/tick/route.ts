import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { inArray } from "drizzle-orm";
import { advanceAssessmentJob } from "@/lib/jobs/orchestrator";

export async function GET(req: NextRequest) {
  return handleCron(req);
}

export async function POST(req: NextRequest) {
  return handleCron(req);
}

async function handleCron(req: NextRequest) {
  // Guard with CRON_SECRET
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET || "aeha-cron-secret-token-key-2026";

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized cron execution" }, { status: 401 });
  }

  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ success: true, processed: 0, message: "No database configured for cron." });
    }

    // Look for assessments in active transitions
    const activeAssessments = await db
      .select()
      .from(schema.assessments)
      .where(
        inArray(schema.assessments.status, [
          "DRAFT",
          "SCOPE_VALIDATED",
          "RECON",
          "SCANNING",
          "ANALYZING",
          "REMEDIATING",
          "REASSESSING",
        ])
      )
      .limit(3);

    const results = [];
    for (const a of activeAssessments) {
      const stepResult = await advanceAssessmentJob(a.id);
      results.push({ id: a.id, result: stepResult });
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      assessments: results,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
