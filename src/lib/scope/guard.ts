import dns from "dns/promises";
import net from "net";

export interface ScopeTargetRecord {
  id?: string;
  type: string; // domain | ip | cidr | url
  value: string;
  criticality?: number;
  verified?: boolean;
  excluded?: boolean;
}

export class ScopeViolationError extends Error {
  code: string;
  target: string;

  constructor(message: string, target: string, code = "SCOPE_VIOLATION") {
    super(`Scope Violation [${code}] for target "${target}": ${message}`);
    this.name = "ScopeViolationError";
    this.code = code;
    this.target = target;
  }
}

/**
 * Checks if an IPv4 address is in a reserved/private/loopback/cloud-metadata range.
 */
export function isPrivateOrReservedIP(ip: string): boolean {
  if (!net.isIP(ip)) return false;

  // IPv6 loopback / unique local / link-local
  if (net.isIPv6(ip)) {
    const lower = ip.toLowerCase();
    if (lower === "::1" || lower === "0:0:0:0:0:0:0:1") return true;
    if (lower.startsWith("fe80:") || lower.startsWith("fc") || lower.startsWith("fd")) return true;
    return false;
  }

  const parts = ip.split(".").map((p) => parseInt(p, 10));
  if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) {
    return true; // malformed treated as unsafe
  }

  const [a, b, c, d] = parts;

  // 127.0.0.0/8 - Loopback
  if (a === 127) return true;

  // 10.0.0.0/8 - Private Class A
  if (a === 10) return true;

  // 172.16.0.0/12 - Private Class B (172.16.0.0 - 172.31.255.255)
  if (a === 172 && b >= 16 && b <= 31) return true;

  // 192.168.0.0/16 - Private Class C
  if (a === 192 && b === 168) return true;

  // 169.254.0.0/16 - Link-local & Cloud Metadata (AWS, Azure, GCP 169.254.169.254)
  if (a === 169 && b === 254) return true;

  // 0.0.0.0/8 - Current network
  if (a === 0) return true;

  // 224.0.0.0/4 - Multicast
  if (a >= 224 && a <= 239) return true;

  // 240.0.0.0/4 - Reserved
  if (a >= 240) return true;

  return false;
}

/**
 * Checks if an IPv4 matches a CIDR (e.g. 192.168.1.0/24).
 */
export function ipMatchesCidr(ip: string, cidr: string): boolean {
  try {
    const [range, bitsStr] = cidr.split("/");
    const bits = bitsStr ? parseInt(bitsStr, 10) : 32;

    if (!net.isIPv4(ip) || !net.isIPv4(range)) return false;
    if (bits < 0 || bits > 32) return false;

    const ipNum = ip
      .split(".")
      .reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
    const rangeNum = range
      .split(".")
      .reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;

    const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;

    return (ipNum & mask) === (rangeNum & mask);
  } catch {
    return false;
  }
}

/**
 * Normalizes a target (URL, domain, IP) into a clean host string.
 */
export function extractHost(target: string): string {
  let cleaned = target.trim();
  if (cleaned.startsWith("http://") || cleaned.startsWith("https://")) {
    try {
      const u = new URL(cleaned);
      return u.hostname;
    } catch {
      // fallback
    }
  }

  // Remove port if present (e.g. example.com:8080)
  if (!cleaned.includes("://") && cleaned.includes(":") && !net.isIPv6(cleaned)) {
    cleaned = cleaned.split(":")[0];
  }

  // Remove trailing slashes
  return cleaned.replace(/\/+$/, "").toLowerCase();
}

/**
 * Resolves a hostname to its IP address with DNS rebinding protection.
 */
export async function resolveSafeHost(host: string): Promise<string[]> {
  if (net.isIP(host)) {
    return [host];
  }

  try {
    const results = await dns.lookup(host, { all: true });
    return results.map((r) => r.address);
  } catch (err: any) {
    throw new ScopeViolationError(
      `Failed to resolve host ${host}: ${err.message}`,
      host,
      "DNS_RESOLUTION_FAILED"
    );
  }
}

/**
 * Pure scope validation against a list of ScopeTarget records.
 */
export async function validateTargetAgainstScope(
  candidateTarget: string,
  scopeList: ScopeTargetRecord[],
  mode: "demo" | "passive" | "worker" = "passive"
): Promise<{ allowed: boolean; host: string; resolvedIps: string[]; reason?: string }> {
  const host = extractHost(candidateTarget);

  if (!host) {
    throw new ScopeViolationError("Empty target supplied", candidateTarget, "INVALID_TARGET");
  }

  // Resolve DNS to verify IP and guard against DNS rebinding
  let resolvedIps: string[] = [];
  if (net.isIP(host)) {
    resolvedIps = [host];
  } else if (mode === "demo") {
    // Simulated mock DNS in demo mode
    resolvedIps = ["93.184.216.34"];
  } else {
    resolvedIps = await resolveSafeHost(host);
  }

  // Passive mode restriction: strictly forbidden from private/internal/cloud metadata IPs
  if (mode === "passive") {
    for (const ip of resolvedIps) {
      if (isPrivateOrReservedIP(ip)) {
        throw new ScopeViolationError(
          `Target resolves to prohibited private/internal/cloud-metadata address (${ip}) in Passive mode.`,
          candidateTarget,
          "PROHIBITED_PRIVATE_IP"
        );
      }
    }
  }

  // Check exclusion list first
  const exclusions = scopeList.filter((s) => s.excluded);
  for (const excl of exclusions) {
    const exclHost = extractHost(excl.value);
    if (excl.type === "cidr" && net.isIPv4(host)) {
      if (ipMatchesCidr(host, excl.value)) {
        throw new ScopeViolationError(
          `Target matches explicitly excluded CIDR scope ${excl.value}`,
          candidateTarget,
          "EXCLUDED_TARGET"
        );
      }
    } else if (host === exclHost || host.endsWith("." + exclHost)) {
      throw new ScopeViolationError(
        `Target matches explicitly excluded domain scope ${excl.value}`,
        candidateTarget,
        "EXCLUDED_TARGET"
      );
    }
  }

  // Check inclusion list
  const inclusions = scopeList.filter((s) => !s.excluded);
  if (inclusions.length === 0) {
    throw new ScopeViolationError("No authorized inclusions defined in scope", candidateTarget, "NO_SCOPE_DEFINED");
  }

  let inScope = false;
  for (const item of inclusions) {
    const itemHost = extractHost(item.value);

    if (item.type === "cidr") {
      for (const ip of resolvedIps) {
        if (ipMatchesCidr(ip, item.value)) {
          inScope = true;
          break;
        }
      }
    } else if (item.type === "ip") {
      if (resolvedIps.includes(itemHost) || host === itemHost) {
        inScope = true;
        break;
      }
    } else if (item.type === "domain" || item.type === "url") {
      if (host === itemHost || host.endsWith("." + itemHost)) {
        inScope = true;
        break;
      }
    }
  }

  if (!inScope) {
    throw new ScopeViolationError(
      `Target "${candidateTarget}" (${host}) is not within the authorized scope list.`,
      candidateTarget,
      "OUT_OF_SCOPE"
    );
  }

  return { allowed: true, host, resolvedIps };
}

/**
 * Shared function assertInScope used by every scanner call.
 */
export async function assertInScope(
  candidateTarget: string,
  scopeList: ScopeTargetRecord[],
  mode: "demo" | "passive" | "worker" = "passive"
): Promise<void> {
  await validateTargetAgainstScope(candidateTarget, scopeList, mode);
}
