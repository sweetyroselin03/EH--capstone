import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createHash } from "crypto";
import { db, schema } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit/logger";
import { eq, and, isNull, gt } from "drizzle-orm";

const AcceptInviteSchema = z
  .object({
    token: z.string().min(10),
    name: z.string().min(2, "Name must be at least 2 characters"),
    password: z
      .string()
      .min(10, "Password must be at least 10 characters")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(/[^a-zA-Z0-9]/, "Password must contain at least one symbol"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json({ success: false, error: "Missing invitation token" }, { status: 400 });
  }

  const tokenHash = createHash("sha256").update(token).digest("hex");

  if (process.env.DATABASE_URL) {
    const invites = await db
      .select()
      .from(schema.invites)
      .where(
        and(
          eq(schema.invites.tokenHash, tokenHash),
          isNull(schema.invites.usedAt),
          gt(schema.invites.expiresAt, new Date())
        )
      )
      .limit(1);

    if (invites.length === 0) {
      return NextResponse.json(
        { success: false, error: "Invalid, expired, or already used invitation link." },
        { status: 400 }
      );
    }

    const inv = invites[0];
    return NextResponse.json({
      success: true,
      email: inv.email,
      role: inv.role,
    });
  }

  return NextResponse.json({
    success: true,
    email: "invited.analyst@aeha.local",
    role: "ANALYST",
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = AcceptInviteSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0]?.message || "Invalid input data" },
        { status: 400 }
      );
    }

    const { token, name, password } = parsed.data;
    const tokenHash = createHash("sha256").update(token).digest("hex");
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "127.0.0.1";

    if (process.env.DATABASE_URL) {
      const invites = await db
        .select()
        .from(schema.invites)
        .where(
          and(
            eq(schema.invites.tokenHash, tokenHash),
            isNull(schema.invites.usedAt),
            gt(schema.invites.expiresAt, new Date())
          )
        )
        .limit(1);

      if (invites.length === 0) {
        return NextResponse.json(
          { success: false, error: "Invalid, expired, or already used invitation link." },
          { status: 400 }
        );
      }

      const inv = invites[0];
      const pHash = hashPassword(password);

      // Create or activate user with invite's role and ACTIVE status (skipping approval!)
      const [newUser] = await db
        .insert(schema.users)
        .values({
          name,
          email: inv.email,
          passwordHash: pHash,
          role: inv.role,
          status: "ACTIVE",
        })
        .returning();

      // Mark invite as used
      await db
        .update(schema.invites)
        .set({ usedAt: new Date() })
        .where(eq(schema.invites.id, inv.id));

      await logAuditEvent({
        actorType: "user",
        actorId: newUser.id,
        action: "USER_INVITE_ACCEPTED",
        entityType: "user",
        entityId: newUser.id,
        details: { email: inv.email, role: inv.role, status: "ACTIVE" },
        ip,
      });

      return NextResponse.json({
        success: true,
        message: "Account provisioned and activated successfully. You may now log in.",
      });
    }

    return NextResponse.json({
      success: true,
      message: "Account provisioned and activated successfully. You may now log in.",
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
