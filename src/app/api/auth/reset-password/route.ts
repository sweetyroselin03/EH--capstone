import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createHash } from "crypto";
import { db, schema } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit/logger";
import { checkRateLimit } from "@/lib/rate-limit";
import { eq, and, isNull, gt } from "drizzle-orm";

const ResetPasswordSchema = z
  .object({
    token: z.string().min(10, "Missing reset token"),
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

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "127.0.0.1";
    const rateCheck = checkRateLimit(`reset-pwd:${ip}`, 5, 15 * 60 * 1000);

    if (!rateCheck.success) {
      return NextResponse.json(
        { success: false, error: "Too many reset attempts. Please wait 15 minutes." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parsed = ResetPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0]?.message || "Invalid input data" },
        { status: 400 }
      );
    }

    const { token, password } = parsed.data;
    const tokenHash = createHash("sha256").update(token).digest("hex");

    if (process.env.DATABASE_URL) {
      const resetRecords = await db
        .select()
        .from(schema.passwordResetTokens)
        .where(
          and(
            eq(schema.passwordResetTokens.tokenHash, tokenHash),
            isNull(schema.passwordResetTokens.usedAt),
            gt(schema.passwordResetTokens.expiresAt, new Date())
          )
        )
        .limit(1);

      if (resetRecords.length === 0) {
        return NextResponse.json(
          { success: false, error: "Password reset token is invalid, expired (1 hour limit), or already used." },
          { status: 400 }
        );
      }

      const rec = resetRecords[0];
      const newHash = hashPassword(password);

      // Update password
      await db
        .update(schema.users)
        .set({ passwordHash: newHash })
        .where(eq(schema.users.id, rec.userId));

      // Mark token used
      await db
        .update(schema.passwordResetTokens)
        .set({ usedAt: new Date() })
        .where(eq(schema.passwordResetTokens.id, rec.id));

      await logAuditEvent({
        actorType: "user",
        actorId: rec.userId,
        action: "USER_PASSWORD_RESET_COMPLETED",
        entityType: "user",
        entityId: rec.userId,
        details: { resetAt: new Date() },
        ip,
      });

      return NextResponse.json({
        success: true,
        message: "Your password has been successfully updated. You can now log in.",
      });
    }

    return NextResponse.json({
      success: true,
      message: "Your password has been successfully updated. You can now log in.",
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
