import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const token = req.headers.get("x-worker-token") || req.headers.get("authorization")?.replace("Bearer ", "");
  const expectedToken = process.env.WORKER_TOKEN || "aeha-worker-secret-token-9988";

  if (token !== expectedToken) {
    return NextResponse.json({ error: "Unauthorized worker authentication" }, { status: 401 });
  }

  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ job: null, message: "No worker jobs available" });
    }

    // Query queued jobs intended for worker execution
    const [queuedJob] = await db
      .select()
      .from(schema.jobs)
      .where(eq(schema.jobs.status, "queued"))
      .limit(1);

    if (!queuedJob) {
      return NextResponse.json({ job: null });
    }

    // Mark running and locked
    await db
      .update(schema.jobs)
      .set({
        status: "running",
        lockedBy: "scanner-worker-01",
        lockedAt: new Date(),
      })
      .where(eq(schema.jobs.id, queuedJob.id));

    return NextResponse.json({
      job: {
        id: queuedJob.id,
        assessmentId: queuedJob.assessmentId,
        step: queuedJob.step,
        payload: queuedJob.payload,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
