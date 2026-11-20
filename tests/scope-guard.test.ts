import { describe, it, expect } from "vitest";
import {
  isPrivateOrReservedIP,
  ipMatchesCidr,
  extractHost,
  validateTargetAgainstScope,
  ScopeViolationError,
} from "@/lib/scope/guard";

describe("Scope Guard & Network Security Unit Tests", () => {
  describe("isPrivateOrReservedIP", () => {
    it("flags 127.0.0.1 loopback as private/reserved", () => {
      expect(isPrivateOrReservedIP("127.0.0.1")).toBe(true);
      expect(isPrivateOrReservedIP("127.0.4.15")).toBe(true);
    });

    it("flags 169.254.169.254 cloud metadata as private/reserved", () => {
      expect(isPrivateOrReservedIP("169.254.169.254")).toBe(true);
      expect(isPrivateOrReservedIP("169.254.1.1")).toBe(true);
    });

    it("flags RFC1918 private ranges as private", () => {
      expect(isPrivateOrReservedIP("10.0.0.1")).toBe(true);
      expect(isPrivateOrReservedIP("172.16.5.2")).toBe(true);
      expect(isPrivateOrReservedIP("172.31.255.255")).toBe(true);
      expect(isPrivateOrReservedIP("192.168.1.1")).toBe(true);
    });

    it("allows public internet IP addresses", () => {
      expect(isPrivateOrReservedIP("8.8.8.8")).toBe(false);
      expect(isPrivateOrReservedIP("1.1.1.1")).toBe(false);
      expect(isPrivateOrReservedIP("93.184.216.34")).toBe(false);
    });
  });

  describe("ipMatchesCidr", () => {
    it("matches IPs inside a /24 subnet", () => {
      expect(ipMatchesCidr("192.168.1.50", "192.168.1.0/24")).toBe(true);
      expect(ipMatchesCidr("192.168.1.254", "192.168.1.0/24")).toBe(true);
      expect(ipMatchesCidr("192.168.2.1", "192.168.1.0/24")).toBe(false);
    });

    it("matches IPs inside a /16 subnet", () => {
      expect(ipMatchesCidr("10.0.4.15", "10.0.0.0/16")).toBe(true);
      expect(ipMatchesCidr("10.1.4.15", "10.0.0.0/16")).toBe(false);
    });
  });

  describe("extractHost", () => {
    it("extracts hostname from URLs", () => {
      expect(extractHost("https://example.com/api/v1")).toBe("example.com");
      expect(extractHost("http://api.test.org:8080/")).toBe("api.test.org");
      expect(extractHost("test.com/")).toBe("test.com");
    });
  });

  describe("validateTargetAgainstScope", () => {
    const scope = [
      { type: "domain", value: "authorized.lab.local", excluded: false },
      { type: "domain", value: "forbidden.authorized.lab.local", excluded: true },
      { type: "cidr", value: "10.0.4.0/24", excluded: false },
    ];

    it("permits authorized in-scope targets in demo mode", async () => {
      const res = await validateTargetAgainstScope("https://authorized.lab.local/login", scope, "demo");
      expect(res.allowed).toBe(true);
      expect(res.host).toBe("authorized.lab.local");
    });

    it("rejects explicitly excluded sub-scopes", async () => {
      await expect(
        validateTargetAgainstScope("forbidden.authorized.lab.local", scope, "demo")
      ).rejects.toThrow(ScopeViolationError);
    });

    it("rejects out-of-scope targets", async () => {
      await expect(
        validateTargetAgainstScope("malicious-external-target.com", scope, "demo")
      ).rejects.toThrow(ScopeViolationError);
    });

    it("strictly blocks private/cloud metadata in passive mode", async () => {
      const passiveScope = [{ type: "ip", value: "169.254.169.254", excluded: false }];
      await expect(
        validateTargetAgainstScope("169.254.169.254", passiveScope, "passive")
      ).rejects.toThrow(/prohibited private\/internal\/cloud-metadata/);
    });
  });
});
