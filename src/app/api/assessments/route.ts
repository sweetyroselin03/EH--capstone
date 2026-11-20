import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db, schema } from "@/lib/db";
import { logAuditEvent } from "@/lib/audit/logger";
import { assertInScope } from "@/lib/scope/guard";
import { desc } from "drizzle-orm";

const CreateAssessmentSchema = z.object({
  name: z.string().min(3).max(100),
  mode: z.enum(["demo", "passive", "worker"]).default("demo"),
  rulesOfEngagement: z.string().min(10),
  authorizationConfirmed: z.literal(true, {
    errorMap: () => ({ message: "You must confirm you are authorized to test these targets." }),
  }),
  authorizationNote: z.string().min(5),
  targets: z.array(
    z.object({
      type: z.enum(["domain", "ip", "cidr", "url"]),
      value: z.string().min(1),
      criticality: z.number().min(1).max(5).default(3),
      excluded: z.boolean().default(false),
    })
  ).min(1, "At least one target must be added."),
});

export async function GET() {
  try {
    if (process.env.DATABASE_URL) {
      const allAssessments = await db
        .select()
        .from(schema.assessments)
        .orderBy(desc(schema.assessments.createdAt));
      return NextResponse.json({ success: true, data: allAssessments });
    }

    return NextResponse.json({
      success: true,
      data: [
        {
          id: "demo-assessment-01",
          name: "Autonomous Infrastructure Threat Modeling & Pentest",
          status: "AWAITING_APPROVAL",
          mode: "demo",
          rulesOfEngagement: "Full autonomous audit with AI risk prioritization.",
          authorizationConfirmed: true,
          authorizationNote: "Authorized by Lab Director per ref ITA1405-DEMO.",
          createdAt: new Date().toISOString(),
        },
      ],
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = CreateAssessmentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.format() },
        { status: 400 }
      );
    }

    const { name, mode, rulesOfEngagement, authorizationConfirmed, authorizationNote, targets } =
      parsed.data;

    // Validate scope targets with Scope Guard
    for (const target of targets) {
      if (!target.excluded) {
        await assertInScope(target.value, targets, mode);
      }
    }

    let createdId = crypto.randomUUID();

    if (process.env.DATABASE_URL) {
      const [newAssessment] = await db
        .insert(schema.assessments)
        .values({
          id: createdId,
          name,
          mode,
          status: "DRAFT",
          rulesOfEngagement,
          authorizationConfirmed,
          authorizationNote,
        })
        .returning();

      createdId = newAssessment.id;

      for (const t of targets) {
        await db.insert(schema.scopeTargets).values({
          assessmentId: createdId,
          type: t.type,
          value: t.value,
          criticality: t.criticality,
          excluded: t.excluded,
          verified: true,
        });
      }
    }

    await logAuditEvent({
      actorType: "user",
      action: "CREATE_ASSESSMENT",
      entityType: "assessment",
      entityId: createdId,
      details: { name, mode, targetsCount: targets.length },
    });

    return NextResponse.json({
      success: true,
      data: { id: createdId, name, status: "DRAFT", mode },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
