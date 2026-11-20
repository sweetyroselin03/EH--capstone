import { db, schema } from "../db";
import { desc } from "drizzle-orm";
import { computeAuditHash, GENESIS_HASH, AuditEntryData, AuditLogRow } from "./hasher";

// In-memory fallback ring buffer for offline/demo/testing modes
const memoryAuditLog: AuditLogRow[] = [];

export async function logAuditEvent(
  data: Omit<AuditEntryData, "ts"> & { ts?: string | Date }
): Promise<AuditLogRow> {
  const ts = data.ts || new Date();
  let prevHash = GENESIS_HASH;

  try {
    if (process.env.DATABASE_URL) {
      const latest = await db
        .select()
        .from(schema.auditLogs)
        .orderBy(desc(schema.auditLogs.ts))
        .limit(1);

      if (latest && latest.length > 0 && latest[0].hash) {
        prevHash = latest[0].hash;
      }
    } else {
      if (memoryAuditLog.length > 0) {
        prevHash = memoryAuditLog[memoryAuditLog.length - 1].hash;
      }
    }
  } catch (err) {
    console.warn("Could not fetch previous audit hash; defaulting to genesis/memory:", err);
    if (memoryAuditLog.length > 0) {
      prevHash = memoryAuditLog[memoryAuditLog.length - 1].hash;
    }
  }

  const hash = computeAuditHash(
    {
      ts,
      actorId: data.actorId,
      actorType: data.actorType,
      action: data.action,
      entityType: data.entityType,
      entityId: data.entityId,
      details: data.details,
      ip: data.ip,
    },
    prevHash
  );

  const entry: AuditLogRow = {
    id: crypto.randomUUID(),
    ts,
    actorId: data.actorId || null,
    actorType: data.actorType,
    action: data.action,
    entityType: data.entityType,
    entityId: data.entityId,
    details: data.details || {},
    ip: data.ip || "127.0.0.1",
    prevHash,
    hash,
  };

  try {
    if (process.env.DATABASE_URL) {
      await db.insert(schema.auditLogs).values({
        id: entry.id,
        ts: typeof entry.ts === "string" ? new Date(entry.ts) : entry.ts,
        actorId: entry.actorId,
        actorType: entry.actorType,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId,
        details: entry.details,
        ip: entry.ip,
        prevHash: entry.prevHash,
        hash: entry.hash,
      });
    }
  } catch (err) {
    console.warn("Database insert for audit log failed; stored in memory fallback:", err);
  }

  memoryAuditLog.push(entry);
  return entry;
}

export async function getAuditLogs(): Promise<AuditLogRow[]> {
  try {
    if (process.env.DATABASE_URL) {
      const rows = await db
        .select()
        .from(schema.auditLogs)
        .orderBy(schema.auditLogs.ts);
      if (rows.length > 0) {
        return rows.map((r) => ({
          ...r,
          actorType: r.actorType as "user" | "system" | "worker" | "ai",
          details: (r.details as Record<string, any>) || {},
        }));
      }
    }
  } catch (err) {
    console.warn("Could not query database audit logs; returning memory logs:", err);
  }

  return [...memoryAuditLog].sort(
    (a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime()
  );
}

export function getMemoryAuditLogs(): AuditLogRow[] {
  return memoryAuditLog;
}
