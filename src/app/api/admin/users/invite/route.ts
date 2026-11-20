import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { randomBytes, createHash } from "crypto";
import { db, schema } from "@/lib/db";
import { auth } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit/logger";

const InviteSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: z.enum(["ADMIN", "ANALYST", "VIEWER"]).default("ANALYST"),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (session?.user && (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized. Admin role required." }, { status: 403 });
    }

    const body = await req.json();
    const parsed = InviteSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "Invalid invite payload" }, { status: 400 });
    }

    const { email, role } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();

    // Generate random 32-byte raw token and SHA-256 hash
    const rawToken = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours

    const adminId = (session?.user as any)?.id || null;
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "127.0.0.1";

    if (process.env.DATABASE_URL) {
      await db.insert(schema.invites).values({
        email: normalizedEmail,
        role,
        tokenHash,
        expiresAt,
        createdBy: adminId,
      });
    }

    await logAuditEvent({
      actorType: "user",
      actorId: adminId,
      action: "USER_INVITE_GENERATED",
      entityType: "invite",
      entityId: normalizedEmail,
      details: { email: normalizedEmail, role, expiresAt },
      ip,
    });

    const host = req.headers.get("host") || "localhost:3000";
    const protocol = req.headers.get("x-forwarded-proto") || "http";
    const inviteLink = `${protocol}://${host}/invite/${rawToken}`;

    return NextResponse.json({
      success: true,
      inviteLink,
      token: rawToken,
      expiresAt: expiresAt.toISOString(),
      message: "One-time invitation link generated successfully (valid for 48 hours).",
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
