import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db, schema } from "../db";
import { eq } from "drizzle-orm";

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

export function comparePassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = String(credentials.email).toLowerCase().trim();
        const password = String(credentials.password);

        // Fallback default admin from environment variable if DB not yet seeded or configured
        const adminEmail = (process.env.ADMIN_EMAIL || "admin@aeha.local").toLowerCase();
        const adminPassword = process.env.ADMIN_PASSWORD || "AdminSecurePassword123!";
        const analystEmail = (process.env.ANALYST_EMAIL || "analyst@aeha.local").toLowerCase();
        const analystPassword = process.env.ANALYST_PASSWORD || "AnalystSecurePassword123!";

        if (email === adminEmail && password === adminPassword) {
          return {
            id: "00000000-0000-0000-0000-000000000001",
            name: "Lead Security Administrator",
            email: adminEmail,
            role: "ADMIN",
          };
        }

        if (email === analystEmail && password === analystPassword) {
          return {
            id: "00000000-0000-0000-0000-000000000002",
            name: "SOC Senior Analyst",
            email: analystEmail,
            role: "ANALYST",
          };
        }

        // Query database users
        try {
          if (process.env.DATABASE_URL) {
            const userResults = await db
              .select()
              .from(schema.users)
              .where(eq(schema.users.email, email))
              .limit(1);

            if (userResults.length > 0) {
              const u = userResults[0];
              const isValid = comparePassword(password, u.passwordHash);
              if (isValid) {
                if (u.status === "PENDING_APPROVAL") {
                  throw new Error("Your account is awaiting admin approval.");
                }
                if (u.status === "DISABLED") {
                  throw new Error("Your account has been disabled. Please contact an administrator.");
                }

                return {
                  id: u.id,
                  name: u.name,
                  email: u.email,
                  role: u.role,
                  status: u.status,
                };
              }
            }
          }
        } catch (err: any) {
          if (
            err.message?.includes("awaiting admin approval") ||
            err.message?.includes("disabled")
          ) {
            throw err;
          }
          console.warn("Auth database query fallback:", err);
        }

        return null;
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role || "ANALYST";
        token.status = (user as any).status || "ACTIVE";
      }
      return token;
    },
    session({ session, token }) {
      if (session.user && token) {
        (session.user as any).id = token.id as string;
        (session.user as any).role = (token.role as string) || "ANALYST";
        (session.user as any).status = (token.status as string) || "ACTIVE";
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.AUTH_SECRET || "aeha-ethical-hacking-default-secret-key-32ch",
});
