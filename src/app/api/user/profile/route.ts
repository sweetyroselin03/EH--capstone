import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db, schema } from "@/lib/db";
import { auth, comparePassword, hashPassword } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit/logger";
import { eq } from "drizzle-orm";

const UpdateProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100).optional(),
  currentPassword: z.string().optional(),
  newPassword: z
    .string()
    .min(10, "Password must be at least 10 characters")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^a-zA-Z0-9]/, "Password must contain at least one symbol")
    .optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const userEmail = session.user.email?.toLowerCase();

  if (process.env.DATABASE_URL && userId) {
    const users = await db
      .select({
        id: schema.users.id,
        name: schema.users.name,
        email: schema.users.email,
        role: schema.users.role,
        status: schema.users.status,
        createdAt: schema.users.createdAt,
      })
      .from(schema.users)
      .where(eq(schema.users.email, userEmail || ""))
      .limit(1);

    if (users.length > 0) {
      return NextResponse.json({ success: true, user: users[0] });
    }
  }

  return NextResponse.json({
    success: true,
    user: {
      id: userId || "user-session-id",
      name: session.user.name || "Security Officer",
      email: session.user.email || "user@aeha.local",
      role: (session.user as any).role || "ANALYST",
      status: (session.user as any).status || "ACTIVE",
    },
  });
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = UpdateProfileSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0]?.message || "Invalid payload" },
        { status: 400 }
      );
    }

    const { name, currentPassword, newPassword } = parsed.data;
    const userId = (session.user as any).id;
    const userEmail = session.user.email?.toLowerCase();
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "127.0.0.1";

    if (process.env.DATABASE_URL && userEmail) {
      const users = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.email, userEmail))
        .limit(1);

      if (users.length > 0) {
        const u = users[0];
        const updateValues: Record<string, any> = {};

        if (name && name !== u.name) {
          updateValues.name = name;
        }

        if (newPassword) {
          if (!currentPassword) {
            return NextResponse.json(
              { success: false, error: "Current password is required to set a new password." },
              { status: 400 }
            );
          }

          const isMatch = comparePassword(currentPassword, u.passwordHash);
          if (!isMatch) {
            return NextResponse.json(
              { success: false, error: "Incorrect current password." },
              { status: 400 }
            );
          }

          updateValues.passwordHash = hashPassword(newPassword);
        }

        if (Object.keys(updateValues).length > 0) {
          await db.update(schema.users).set(updateValues).where(eq(schema.users.id, u.id));

          await logAuditEvent({
            actorType: "user",
            actorId: u.id,
            action: "USER_PROFILE_UPDATED",
            entityType: "user",
            entityId: u.id,
            details: { nameUpdated: !!updateValues.name, passwordUpdated: !!updateValues.passwordHash },
            ip,
          });
        }

        return NextResponse.json({ success: true, message: "Profile updated successfully." });
      }
    }

    return NextResponse.json({ success: true, message: "Profile updated successfully." });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
