export interface ReportData {
  assessment: {
    id: string;
    name: string;
    status: string;
    mode: string;
    rulesOfEngagement: string;
    authorizationConfirmed: boolean;
    authorizationNote?: string | null;
    startedAt?: string | Date | null;
    finishedAt?: string | Date | null;
  };
  scope: Array<{
    type: string;
    value: string;
    criticality: number;
    verified: boolean;
    excluded: boolean;
  }>;
  assets: Array<{
    hostname?: string | null;
    ip: string;
    osGuess?: string | null;
    criticality: number;
    exposure: string;
    servicesCount: number;
  }>;
  findings: Array<{
    id: string;
    title: string;
    severity: string;
    cvss: number | null;
    riskScore?: number | null;
    cve?: string | null;
    cwe?: string | null;
    status: string;
    description: string;
    evidence?: any;
    remediationTitle?: string | null;
    remediationSteps?: string[] | null;
    remediationStatus?: string | null;
  }>;
  summary: {
    totalFindings: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
    resolved: number;
    open: number;
    falsePositive: number;
    overallRiskScore: number;
  };
}

export function generateReportJSON(data: ReportData): string {
  return JSON.stringify(
    {
      meta: {
        reportTitle: `AEHA Security Assessment Report - ${data.assessment.name}`,
        generatedAt: new Date().toISOString(),
        version: "1.0",
        standard: "AEHA-ITA1405-PENETRATION-TESTING",
      },
      ...data,
    },
    null,
    2
  );
}

export function generateReportCSV(data: ReportData): string {
  const headers = [
    "Finding ID",
    "Title",
    "Severity",
    "CVSS",
    "Risk Score",
    "Status",
    "CVE",
    "CWE",
    "Remediation Action",
    "Remediation Status",
  ];

  const rows = data.findings.map((f) => [
    `"${f.id}"`,
    `"${f.title.replace(/"/g, '""')}"`,
    `"${f.severity.toUpperCase()}"`,
    `"${f.cvss ?? 'N/A'}"`,
    `"${f.riskScore ?? 'N/A'}"`,
    `"${f.status}"`,
    `"${f.cve || 'N/A'}"`,
    `"${f.cwe || 'N/A'}"`,
    `"${(f.remediationTitle || '').replace(/"/g, '""')}"`,
    `"${f.remediationStatus || 'proposed'}"`,
  ]);

  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}

export function generateExecutiveHTML(data: ReportData): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>AEHA Security Assessment - ${data.assessment.name}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; padding: 40px; }
    h1 { color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; }
    h2 { color: #334155; margin-top: 32px; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 9999px; font-weight: 600; font-size: 12px; text-transform: uppercase; }
    .critical { background: #fee2e2; color: #991b1b; }
    .high { background: #ffedd5; color: #9a3412; }
    .medium { background: #fef3c7; color: #92400e; }
    .low { background: #e0f2fe; color: #075985; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; }
    th, td { border: 1px solid #cbd5e1; padding: 10px 14px; text-align: left; }
    th { background: #f8fafc; font-weight: 600; }
    .kpi-container { display: flex; gap: 20px; margin: 20px 0; }
    .kpi-card { border: 1px solid #e2e8f0; padding: 16px; border-radius: 8px; flex: 1; background: #f8fafc; }
    .kpi-val { font-size: 28px; font-weight: 700; color: #0f172a; }
  </style>
</head>
<body>
  <h1>Autonomous Ethical Hacking Assistant (AEHA)</h1>
  <h3>Executive Penetration Testing & Vulnerability Assessment Report</h3>
  
  <p><strong>Assessment:</strong> ${data.assessment.name} | <strong>Mode:</strong> ${data.assessment.mode.toUpperCase()} | <strong>Status:</strong> ${data.assessment.status}</p>
  <p><strong>Authorization Note:</strong> ${data.assessment.authorizationNote || 'Authorized testing'}</p>

  <div class="kpi-container">
    <div class="kpi-card">
      <div>Overall Risk Score</div>
      <div class="kpi-val">${data.summary.overallRiskScore}/100</div>
    </div>
    <div class="kpi-card">
      <div>Total Findings</div>
      <div class="kpi-val">${data.summary.totalFindings}</div>
    </div>
    <div class="kpi-card">
      <div>Critical / High</div>
      <div class="kpi-val" style="color: #dc2626;">${data.summary.critical + data.summary.high}</div>
    </div>
    <div class="kpi-card">
      <div>Remediated / Resolved</div>
      <div class="kpi-val" style="color: #16a34a;">${data.summary.resolved}</div>
    </div>
  </div>

  <h2>1. Discovered Assets & Attack Surface</h2>
  <table>
    <thead>
      <tr><th>IP Address</th><th>Hostname</th><th>Exposure</th><th>Criticality</th><th>Services</th></tr>
    </thead>
    <tbody>
      ${data.assets
        .map(
          (a) => `<tr>
        <td><code>${a.ip}</code></td>
        <td>${a.hostname || 'N/A'}</td>
        <td>${a.exposure}</td>
        <td>${a.criticality}/5</td>
        <td>${a.servicesCount}</td>
      </tr>`
        )
        .join("")}
    </tbody>
  </table>

  <h2>2. Vulnerability Findings & Risk Ranking</h2>
  <table>
    <thead>
      <tr><th>Severity</th><th>Title</th><th>CVE</th><th>CVSS</th><th>Risk Score</th><th>Status</th><th>Remediation</th></tr>
    </thead>
    <tbody>
      ${data.findings
        .map(
          (f) => `<tr>
        <td><span class="badge ${f.severity}">${f.severity}</span></td>
        <td><strong>${f.title}</strong><br><small>${f.description.slice(0, 150)}...</small></td>
        <td><code>${f.cve || 'N/A'}</code></td>
        <td>${f.cvss ?? 'N/A'}</td>
        <td><strong>${f.riskScore ?? 'N/A'}</strong></td>
        <td>${f.status}</td>
        <td>${f.remediationTitle || 'N/A'}</td>
      </tr>`
        )
        .join("")}
    </tbody>
  </table>

  <h2>3. Rules of Engagement & Authorization Appendix</h2>
  <p>${data.assessment.rulesOfEngagement}</p>
  <p><em>Generated autonomously by AEHA (ITA1405 Ethical Hacking Assistant). Cryptographic audit trail recorded.</em></p>
</body>
</html>`;
}
