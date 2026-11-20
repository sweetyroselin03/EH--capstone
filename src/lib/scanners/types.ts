export interface NormalizedAsset {
  id?: string;
  hostname?: string;
  ip: string;
  osGuess?: string;
  criticality: number;
  exposure: "internet" | "internal";
  services: NormalizedService[];
}

export interface NormalizedService {
  id?: string;
  port: number;
  protocol: string;
  name: string;
  product?: string;
  version?: string;
}

export interface NormalizedFinding {
  id?: string;
  assetIp: string;
  servicePort?: number;
  source: "nmap" | "openvas" | "zap" | "passive" | "demo";
  sourceId?: string;
  title: string;
  description: string;
  cwe?: string;
  cve?: string;
  cvss: number;
  severity: "info" | "low" | "medium" | "high" | "critical";
  evidence: Record<string, any>;
  status?: "open" | "false_positive" | "accepted" | "remediating" | "resolved" | "reopened";
}

export interface ScanResult {
  assets: NormalizedAsset[];
  findings: NormalizedFinding[];
}

export interface ScannerAdapter {
  name: string;
  discover(scope: any[]): Promise<NormalizedAsset[]>;
  scan(assets: NormalizedAsset[], scope: any[]): Promise<NormalizedFinding[]>;
}
