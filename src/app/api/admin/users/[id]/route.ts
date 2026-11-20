import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db, schema } from "@/lib/db";
import { auth } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit/logger";
import { eq } from "drizzle-orm";

const UpdateUserSchema = z.object({
  action: z.enum(["approve", "reject", "change_role", "toggle_status"]),
  role: z.enum(["ADMIN", "ANALYST", "VIEWER"]).optional(),
  status: z.enum(["ACTIVE", "DISABLED", "PENDING_APPROVAL"]).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();

    if (session?.user && (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized. Admin role required." }, { status: 403 });
    }

    const body = await req.json();
    const parsed = UpdateUserSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "Invalid operation payload" }, { status: 400 });
    }

    const { action, role, status } = parsed.data;
    const adminId = (session?.user as any)?.id || "admin";
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "127.0.0.1";

    if (process.env.DATABASE_URL) {
      if (action === "approve") {
        await db
          .update(schema.users)
          .set({ status: "ACTIVE" })
          .where(eq(schema.users.id, id));

        await logAuditEvent({
          actorType: "user",
          actorId: adminId,
          action: "USER_APPROVE",
          entityType: "user",
          entityId: id,
          details: { status: "ACTIVE" },
          ip,
        });

        return NextResponse.json({ success: true, message: "User successfully approved." });
      }

      if (action === "reject") {
        await db.delete(schema.users).where(eq(schema.users.id, id));

        await logAuditEvent({
          actorType: "user",
          actorId: adminId,
          action: "USER_REJECT",
          entityType: "user",
          entityId: id,
          details: { rejected: true },
          ip,
        });

        return NextResponse.json({ success: true, message: "User registration rejected." });
      }

      if (action === "change_role" && role) {
        await db
          .update(schema.users)
          .set({ role })
          .where(eq(schema.users.id, id));

        await logAuditEvent({
          actorType: "user",
          actorId: adminId,
          action: "USER_ROLE_CHANGE",
          entityType: "user",
          entityId: id,
          details: { newRole: role },
          ip,
        });

        return NextResponse.json({ success: true, message: `User role updated to ${role}.` });
      }

      if (action === "toggle_status" && status) {
        await db
          .update(schema.users)
          .set({ status })
          .where(eq(schema.users.id, id));

        await logAuditEvent({
          actorType: "user",
          actorId: adminId,
          action: status === "DISABLED" ? "USER_DISABLE" : "USER_ENABLE",
          entityType: "user",
          entityId: id,
          details: { status },
          ip,
        });

        return NextResponse.json({ success: true, message: `User status updated to ${status}.` });
      }
    }

    return NextResponse.json({ success: true, message: "Action processed successfully." });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
