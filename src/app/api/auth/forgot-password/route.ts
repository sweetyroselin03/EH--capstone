import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { randomBytes, createHash } from "crypto";
import { db, schema } from "@/lib/db";
import { logAuditEvent } from "@/lib/audit/logger";
import { checkRateLimit } from "@/lib/rate-limit";
import { eq } from "drizzle-orm";

const ForgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "127.0.0.1";
    const rateCheck = checkRateLimit(`forgot-pwd:${ip}`, 3, 15 * 60 * 1000);

    if (!rateCheck.success) {
      return NextResponse.json(
        { success: false, error: "Too many password reset requests. Please try again in 15 minutes." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parsed = ForgotPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "Invalid email address" }, { status: 400 });
    }

    const { email } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();

    const rawToken = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiration

    const host = req.headers.get("host") || "localhost:3000";
    const protocol = req.headers.get("x-forwarded-proto") || "http";
    const resetLink = `${protocol}://${host}/reset-password/${rawToken}`;

    if (process.env.DATABASE_URL) {
      const users = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.email, normalizedEmail))
        .limit(1);

      if (users.length > 0) {
        const u = users[0];
        await db.insert(schema.passwordResetTokens).values({
          userId: u.id,
          tokenHash,
          expiresAt,
        });

        await logAuditEvent({
          actorType: "user",
          actorId: u.id,
          action: "USER_PASSWORD_RESET_REQUESTED",
          entityType: "password_reset",
          entityId: u.id,
          details: { email: normalizedEmail, expiresAt },
          ip,
        });

        // If RESEND_API_KEY is configured, send email; otherwise provide in response / audit log
        if (process.env.RESEND_API_KEY) {
          try {
            await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                from: process.env.ALERT_FROM_EMAIL || "security@aeha.local",
                to: normalizedEmail,
                subject: "AEHA Password Reset Request",
                html: `<p>A password reset was requested for your AEHA account.</p><p><a href="${resetLink}">Click here to reset your password</a> (valid for 1 hour).</p>`,
              }),
            });
          } catch (mailErr) {
            console.warn("Resend email dispatch error:", mailErr);
          }
        }
      }
    }

    // Return generic success message to prevent user enumeration attacks
    return NextResponse.json({
      success: true,
      message: "If an account with that email exists, password reset instructions have been generated.",
      // For local testing & college demo environments without active email delivery:
      demoResetLink: resetLink,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
