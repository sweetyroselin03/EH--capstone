import { createHash } from "crypto";

export interface AuditEntryData {
  ts: string | Date;
  actorId?: string | null;
  actorType: "user" | "system" | "worker" | "ai";
  action: string;
  entityType: string;
  entityId: string;
  details?: Record<string, any> | null;
  ip?: string | null;
}

export interface AuditLogRow extends AuditEntryData {
  id: string;
  prevHash: string;
  hash: string;
}

export const GENESIS_HASH = "0000000000000000000000000000000000000000000000000000000000000000";

/**
 * Computes a deterministic SHA-256 hash for an audit log entry chained to prevHash.
 */
export function computeAuditHash(entry: AuditEntryData, prevHash: string): string {
  const normalizedTs =
    entry.ts instanceof Date ? entry.ts.toISOString() : new Date(entry.ts).toISOString();

  const normalizedDetails = entry.details
    ? JSON.stringify(entry.details, Object.keys(entry.details).sort())
    : "{}";

  const canonicalPayload = [
    prevHash,
    normalizedTs,
    entry.actorId || "none",
    entry.actorType,
    entry.action,
    entry.entityType,
    entry.entityId,
    entry.ip || "127.0.0.1",
    normalizedDetails,
  ].join("|");

  return createHash("sha256").update(canonicalPayload).digest("hex");
}

/**
 * Validates the chronological SHA-256 hash chain of audit records.
 * Returns valid: true if completely unbroken, or identifies the exact record that was modified/tampered.
 */
export function verifyAuditChain(logs: AuditLogRow[]): {
  valid: boolean;
  tamperedIndex?: number;
  tamperedId?: string;
  message: string;
} {
  if (!logs || logs.length === 0) {
    return { valid: true, message: "Audit log is empty. Integrity verified." };
  }

  // Sort chronologically ascending by ts
  const sorted = [...logs].sort(
    (a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime()
  );

  let expectedPrevHash = GENESIS_HASH;

  for (let i = 0; i < sorted.length; i++) {
    const row = sorted[i];

    // Check prevHash linkage
    if (i === 0) {
      if (row.prevHash !== GENESIS_HASH && row.prevHash.length !== 64) {
        return {
          valid: false,
          tamperedIndex: i,
          tamperedId: row.id,
          message: `Genesis block tampering detected at entry index ${i} (ID: ${row.id})`,
        };
      }
      expectedPrevHash = row.prevHash;
    } else {
      if (row.prevHash !== expectedPrevHash) {
        return {
          valid: false,
          tamperedIndex: i,
          tamperedId: row.id,
          message: `Broken chain link at index ${i} (ID: ${row.id}): expected prevHash ${expectedPrevHash.slice(0, 10)}... but found ${row.prevHash.slice(0, 10)}...`,
        };
      }
    }

    // Recalculate hash of row
    const recalculatedHash = computeAuditHash(row, row.prevHash);
    if (recalculatedHash !== row.hash) {
      return {
        valid: false,
        tamperedIndex: i,
        tamperedId: row.id,
        message: `Content modification detected at index ${i} (ID: ${row.id}): hash mismatch. Log record was altered after creation!`,
      };
    }

    expectedPrevHash = row.hash;
  }

  return {
    valid: true,
    message: `All ${sorted.length} audit entries cryptographically verified. Hash chain is intact.`,
  };
}
