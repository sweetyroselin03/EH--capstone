import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db, schema } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit/logger";
import { checkRateLimit } from "@/lib/rate-limit";
import { eq } from "drizzle-orm";

const RegisterSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters").max(100),
    email: z.string().email("Invalid email address"),
    password: z
      .string()
      .min(10, "Password must be at least 10 characters")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(/[^a-zA-Z0-9]/, "Password must contain at least one special character/symbol"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "127.0.0.1";
    const rateCheck = checkRateLimit(`register:${ip}`, 5, 10 * 60 * 1000);

    if (!rateCheck.success) {
      return NextResponse.json(
        { success: false, error: "Too many registration attempts. Please try again later." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parsed = RegisterSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0]?.message || "Invalid input data" },
        { status: 400 }
      );
    }

    const { name, email, password } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();

    if (process.env.DATABASE_URL) {
      // Check if user already exists
      const existing = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.email, normalizedEmail))
        .limit(1);

      if (existing.length > 0) {
        return NextResponse.json(
          { success: false, error: "An account with this email already exists." },
          { status: 400 }
        );
      }

      const pHash = hashPassword(password);
      const [newUser] = await db
        .insert(schema.users)
        .values({
          name,
          email: normalizedEmail,
          passwordHash: pHash,
          role: "VIEWER",
          status: "PENDING_APPROVAL",
        })
        .returning();

      await logAuditEvent({
        actorType: "user",
        actorId: newUser.id,
        action: "USER_REGISTER",
        entityType: "user",
        entityId: newUser.id,
        details: { email: normalizedEmail, role: "VIEWER", status: "PENDING_APPROVAL" },
        ip,
      });

      return NextResponse.json({
        success: true,
        message: "Your account is awaiting admin approval.",
      });
    }

    // Fallback when DB is in memory
    await logAuditEvent({
      actorType: "user",
      action: "USER_REGISTER",
      entityType: "user",
      entityId: "demo-user",
      details: { email: normalizedEmail, status: "PENDING_APPROVAL" },
      ip,
    });

    return NextResponse.json({
      success: true,
      message: "Your account is awaiting admin approval.",
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
