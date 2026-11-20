import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { auth } from "@/lib/auth";
import { desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    // Verify ADMIN role
    if (session?.user && (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Access denied. Administrator privileges required." }, { status: 403 });
    }

    if (process.env.DATABASE_URL) {
      const allUsers = await db
        .select({
          id: schema.users.id,
          name: schema.users.name,
          email: schema.users.email,
          role: schema.users.role,
          status: schema.users.status,
          createdAt: schema.users.createdAt,
        })
        .from(schema.users)
        .orderBy(desc(schema.users.createdAt));

      const pendingInvites = await db
        .select()
        .from(schema.invites)
        .orderBy(desc(schema.invites.createdAt));

      return NextResponse.json({
        success: true,
        users: allUsers,
        invites: pendingInvites,
      });
    }

    // Demo in-memory fallback
    return NextResponse.json({
      success: true,
      users: [
        {
          id: "u1",
          name: "Lead Security Administrator",
          email: "admin@aeha.local",
          role: "ADMIN",
          status: "ACTIVE",
          createdAt: new Date().toISOString(),
        },
        {
          id: "u2",
          name: "SOC Senior Analyst",
          email: "analyst@aeha.local",
          role: "ANALYST",
          status: "ACTIVE",
          createdAt: new Date().toISOString(),
        },
        {
          id: "u3",
          name: "Security Intern Candidate",
          email: "intern@aeha.local",
          role: "VIEWER",
          status: "PENDING_APPROVAL",
          createdAt: new Date().toISOString(),
        },
      ],
      invites: [],
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
