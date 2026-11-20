import { NextResponse } from "next/server";
import { getAuditLogs } from "@/lib/audit/logger";
import { verifyAuditChain } from "@/lib/audit/hasher";

export async function GET() {
  try {
    const logs = await getAuditLogs();
    const result = verifyAuditChain(logs);

    return NextResponse.json({
      success: true,
      verified: result.valid,
      entriesCount: logs.length,
      tamperedIndex: result.tamperedIndex,
      tamperedId: result.tamperedId,
      message: result.message,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
