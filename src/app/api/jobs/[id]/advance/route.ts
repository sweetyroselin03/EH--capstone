import { NextRequest, NextResponse } from "next/server";
import { advanceAssessmentJob } from "@/lib/jobs/orchestrator";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await advanceAssessmentJob(id);

    return NextResponse.json({
      success: result.success,
      status: result.assessmentStatus,
      nextStep: result.nextStep,
      message: result.message,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
