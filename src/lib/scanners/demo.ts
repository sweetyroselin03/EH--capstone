import { ScannerAdapter, NormalizedAsset, NormalizedFinding } from "./types";

export class DemoScanner implements ScannerAdapter {
  name = "DemoScanner";

  async discover(scope: any[]): Promise<NormalizedAsset[]> {
    // Generate realistic simulated assets based on the defined scope
    const target = scope[0]?.value || "demo.lab.local";

    return [
      {
        hostname: `api.${target.replace(/^https?:\/\//, "").split("/")[0]}`,
        ip: "10.0.4.15",
        osGuess: "Linux 5.15 (Ubuntu 22.04 LTS)",
        criticality: 5,
        exposure: "internet",
        services: [
          { port: 80, protocol: "tcp", name: "http", product: "nginx", version: "1.18.0" },
          { port: 443, protocol: "tcp", name: "https", product: "nginx", version: "1.18.0" },
          { port: 8080, protocol: "tcp", name: "http-alt", product: "Apache Tomcat / Spring", version: "9.0.58" },
        ],
      },
      {
        hostname: `auth.${target.replace(/^https?:\/\//, "").split("/")[0]}`,
        ip: "10.0.4.22",
        osGuess: "Linux 5.10 (Debian 11)",
        criticality: 4,
        exposure: "internet",
        services: [
          { port: 22, protocol: "tcp", name: "ssh", product: "OpenSSH", version: "8.2p1" },
          { port: 5432, protocol: "tcp", name: "postgresql", product: "PostgreSQL Database", version: "13.4" },
        ],
      },
      {
        hostname: `portal.${target.replace(/^https?:\/\//, "").split("/")[0]}`,
        ip: "10.0.4.50",
        osGuess: "Linux (Alpine)",
        criticality: 3,
        exposure: "internal",
        services: [
          { port: 3000, protocol: "tcp", name: "node-app", product: "Node.js Express", version: "18.16.0" },
          { port: 6379, protocol: "tcp", name: "redis", product: "Redis key-value store", version: "6.2.6" },
        ],
      },
    ];
  }

  async scan(assets: NormalizedAsset[], _scope: any[]): Promise<NormalizedFinding[]> {
    const findings: NormalizedFinding[] = [];

    // Asset 1 findings (api)
    findings.push({
      assetIp: "10.0.4.15",
      servicePort: 8080,
      source: "demo",
      sourceId: "DEMO-RCE-001",
      title: "Spring Framework Remote Code Execution (Spring4Shell)",
      description:
        "A Spring MVC or Spring WebFlux application running on JDK 9+ is vulnerable to remote code execution via DataBinder parameter binding.",
      cwe: "CWE-94",
      cve: "CVE-2022-22965",
      cvss: 9.8,
      severity: "critical",
      evidence: {
        endpoint: "http://10.0.4.15:8080/helloworld/greeting",
        param: "class.module.classLoader.resources.context.parent.pipeline.first.pattern",
        responseCode: 200,
        banner: "Apache Tomcat/9.0.58",
      },
    });

    // Deliberate Duplicate of Spring4Shell from secondary probe
    findings.push({
      assetIp: "10.0.4.15",
      servicePort: 8080,
      source: "demo",
      sourceId: "DEMO-RCE-001-DUP",
      title: "Spring Core DataBinder Unauthenticated RCE",
      description:
        "Duplicate detection candidate: Identical vulnerability CVE-2022-22965 discovered via HTTP payload fuzzing against Tomcat endpoint.",
      cwe: "CWE-94",
      cve: "CVE-2022-22965",
      cvss: 9.8,
      severity: "critical",
      evidence: {
        endpoint: "http://10.0.4.15:8080/api/v1/auth",
        parameter: "class.module.classLoader",
        duplicateCandidate: true,
      },
    });

    findings.push({
      assetIp: "10.0.4.15",
      servicePort: 443,
      source: "demo",
      sourceId: "DEMO-TLS-002",
      title: "Deprecated TLS 1.0 and TLS 1.1 Protocols Enabled",
      description:
        "The web server negotiates legacy TLS 1.0 and TLS 1.1 cipher suites susceptible to downgrade and cipher-block chaining attacks.",
      cwe: "CWE-326",
      cve: "CVE-2011-3389",
      cvss: 3.7,
      severity: "low",
      evidence: {
        port: 443,
        ciphers: ["TLS_RSA_WITH_AES_128_CBC_SHA", "TLS_RSA_WITH_AES_256_CBC_SHA"],
        handshake: "TLSv1.0 accepted",
      },
    });

    // Asset 2 findings (auth & db)
    findings.push({
      assetIp: "10.0.4.22",
      servicePort: 5432,
      source: "demo",
      sourceId: "DEMO-DB-003",
      title: "PostgreSQL Database Exposed without Mandatory SSL",
      description:
        "PostgreSQL listens on port 5432 and allows client connections without requiring SSL transport encryption, exposing credentials.",
      cwe: "CWE-319",
      cvss: 7.5,
      severity: "high",
      evidence: {
        port: 5432,
        sslRequired: false,
        authMethods: ["md5", "scram-sha-256"],
      },
    });

    findings.push({
      assetIp: "10.0.4.22",
      servicePort: 22,
      source: "demo",
      sourceId: "DEMO-SSH-004",
      title: "OpenSSH Signal Handler Race Condition (regreSSHion)",
      description:
        "OpenSSH server version 8.2p1 has a signal handler race condition in sshd that can allow unauthenticated remote code execution as root.",
      cwe: "CWE-362",
      cve: "CVE-2024-6387",
      cvss: 8.1,
      severity: "high",
      evidence: {
        banner: "SSH-2.0-OpenSSH_8.2p1 Ubuntu-4ubuntu0.5",
        protocol: "SSH-2.0",
      },
    });

    // Asset 3 findings (portal & redis)
    findings.push({
      assetIp: "10.0.4.50",
      servicePort: 6379,
      source: "demo",
      sourceId: "DEMO-REDIS-005",
      title: "Redis Instance Unauthenticated Access",
      description:
        "Redis database instance is accessible without password authentication on standard port 6379, allowing arbitrary key manipulation.",
      cwe: "CWE-306",
      cvss: 8.8,
      severity: "high",
      evidence: {
        response: "+PONG",
        infoCommand: "redis_version:6.2.6",
      },
    });

    findings.push({
      assetIp: "10.0.4.50",
      servicePort: 3000,
      source: "demo",
      sourceId: "DEMO-XSS-006",
      title: "Reflected Cross-Site Scripting (XSS) in Search Filter",
      description:
        "The search parameter `q` is reflected without contextual HTML entity encoding in the results view.",
      cwe: "CWE-79",
      cvss: 6.1,
      severity: "medium",
      evidence: {
        url: "http://10.0.4.50:3000/search?q=%3Cscript%3Ealert(1)%3C%2Fscript%3E",
        reflection: "<div class=\"search-title\">Results for <script>alert(1)</script></div>",
      },
    });

    // Deliberate False Positive: Automated scanner thought static stylesheet had SQLi because query string was echoed in 404
    findings.push({
      assetIp: "10.0.4.50",
      servicePort: 3000,
      source: "demo",
      sourceId: "DEMO-FP-007",
      title: "SQL Injection in Static Resource URL Parameter",
      description:
        "Scanner flagged potential SQL injection based on generic error response when requesting static stylesheet /assets/main.css?theme=' OR 1=1--",
      cwe: "CWE-89",
      cve: "",
      cvss: 8.5,
      severity: "high",
      evidence: {
        url: "/assets/main.css?theme=' OR 1=1--",
        responseCode: 404,
        responseSnippet: "Cannot GET /assets/main.css",
        confidence: "LOW",
        heuristic: "Pattern match on standard SQL keyword",
      },
    });

    findings.push({
      assetIp: "10.0.4.50",
      servicePort: 3000,
      source: "demo",
      sourceId: "DEMO-HSTS-008",
      title: "Missing HTTP Strict Transport Security (HSTS) Header",
      description:
        "The web application does not transmit the Strict-Transport-Security header, allowing potential SSL-stripping man-in-the-middle attacks.",
      cwe: "CWE-319",
      cvss: 4.3,
      severity: "medium",
      evidence: {
        headers: {
          "content-type": "text/html; charset=utf-8",
          server: "Express",
        },
      },
    });

    // Deliberate Duplicate of HSTS
    findings.push({
      assetIp: "10.0.4.50",
      servicePort: 3000,
      source: "demo",
      sourceId: "DEMO-HSTS-008-DUP",
      title: "HSTS Header Not Present on Response",
      description:
        "Passive crawler inspection reported missing HSTS response header on index route.",
      cwe: "CWE-319",
      cvss: 4.3,
      severity: "medium",
      evidence: {
        route: "/",
        missingHeader: "Strict-Transport-Security",
      },
    });

    return findings;
  }
}
