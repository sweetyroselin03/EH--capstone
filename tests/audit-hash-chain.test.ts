import { describe, it, expect } from "vitest";
import {
  computeAuditHash,
  verifyAuditChain,
  GENESIS_HASH,
  AuditLogRow,
} from "@/lib/audit/hasher";

describe("Audit Log SHA-256 Hash Chain Integrity Tests", () => {
  function createSampleChain(): AuditLogRow[] {
    const chain: AuditLogRow[] = [];
    let prev = GENESIS_HASH;

    for (let i = 0; i < 5; i++) {
      const ts = new Date(Date.now() + i * 1000).toISOString();
      const payload = {
        ts,
        actorId: `user-${i}`,
        actorType: "user" as const,
        action: `SECURITY_ACTION_${i}`,
        entityType: "finding",
        entityId: `finding-${i}`,
        details: { step: i },
        ip: "10.0.0.1",
      };

      const hash = computeAuditHash(payload, prev);
      const row: AuditLogRow = {
        id: `log-${i}`,
        ...payload,
        prevHash: prev,
        hash,
      };

      chain.push(row);
      prev = hash;
    }

    return chain;
  }

  it("verifies an authentic, untampered audit log hash chain", () => {
    const chain = createSampleChain();
    const result = verifyAuditChain(chain);
    expect(result.valid).toBe(true);
    expect(result.message).toContain("cryptographically verified");
  });

  it("detects tampering when an audit log payload or action is altered", () => {
    const chain = createSampleChain();
    // Tamper with record at index 2
    chain[2].action = "MALICIOUSLY_ALTERED_ACTION";

    const result = verifyAuditChain(chain);
    expect(result.valid).toBe(false);
    expect(result.tamperedIndex).toBe(2);
    expect(result.message).toContain("hash mismatch");
  });

  it("detects tampering when a record is deleted or prevHash linkage is broken", () => {
    const chain = createSampleChain();
    // Break prevHash on index 3
    chain[3].prevHash = "0000000000000000000000000000000000000000000000000000000000001234";

    const result = verifyAuditChain(chain);
    expect(result.valid).toBe(false);
    expect(result.tamperedIndex).toBe(3);
    expect(result.message).toContain("Broken chain link");
  });
});
