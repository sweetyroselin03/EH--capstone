import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { logAuditEvent } from "@/lib/audit/logger";

const ApprovalDecisionSchema = z.object({
  decision: z.enum(["approved", "rejected"]),
  reason: z.string().min(3, "A justification reason is required for approval or rejection."),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = ApprovalDecisionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.format() }, { status: 400 });
    }

    const { decision, reason } = parsed.data;

    if (process.env.DATABASE_URL) {
      // Find approval record or remediation
      const [approval] = await db
        .select()
        .from(schema.approvals)
        .where(eq(schema.approvals.id, id));

      const remediationId = approval?.remediationId || id;

      // Update approval record
      if (approval) {
        await db
          .update(schema.approvals)
          .set({
            decision,
            reason,
            decidedAt: new Date(),
          })
          .where(eq(schema.approvals.id, id));
      }

      // Update remediation status
      const nextRemediationStatus = decision === "approved" ? "approved" : "rejected";
      await db
        .update(schema.remediations)
        .set({ status: nextRemediationStatus })
        .where(eq(schema.remediations.id, remediationId));
    }

    await logAuditEvent({
      actorType: "user",
      action: `REMEDIATION_${decision.toUpperCase()}`,
      entityType: "remediation",
      entityId: id,
      details: { decision, reason },
    });

    return NextResponse.json({
      success: true,
      data: { id, decision, reason },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
