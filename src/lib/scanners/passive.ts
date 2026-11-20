import { ScannerAdapter, NormalizedAsset, NormalizedFinding } from "./types";
import { assertInScope } from "../scope/guard";

export class WebPassiveScanner implements ScannerAdapter {
  name = "WebPassiveScanner";

  async discover(scope: any[]): Promise<NormalizedAsset[]> {
    const assets: NormalizedAsset[] = [];

    for (const item of scope) {
      if (item.excluded) continue;

      // Ensure item is verified and in scope
      await assertInScope(item.value, scope, "passive");

      let rawUrl = item.value;
      if (!rawUrl.startsWith("http://") && !rawUrl.startsWith("https://")) {
        rawUrl = `https://${rawUrl}`;
      }

      let urlObj: URL;
      try {
        urlObj = new URL(rawUrl);
      } catch {
        continue;
      }

      const hostname = urlObj.hostname;
      const port = urlObj.port ? parseInt(urlObj.port, 10) : urlObj.protocol === "https:" ? 443 : 80;

      assets.push({
        hostname,
        ip: "external-verified",
        criticality: item.criticality || 3,
        exposure: "internet",
        services: [
          {
            port,
            protocol: "tcp",
            name: urlObj.protocol.replace(":", ""),
            product: "HTTP Web Server",
          },
        ],
      });
    }

    return assets;
  }

  async scan(assets: NormalizedAsset[], scope: any[]): Promise<NormalizedFinding[]> {
    const findings: NormalizedFinding[] = [];

    for (const asset of assets) {
      const targetHost = asset.hostname || asset.ip;
      await assertInScope(targetHost, scope, "passive");

      const targetUrl = `https://${targetHost}`;

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);

        const res = await fetch(targetUrl, {
          method: "GET",
          signal: controller.signal,
          redirect: "follow",
          headers: {
            "User-Agent": "AEHA-EthicalHackingAssistant-PassiveScanner/1.0 (Authorized Audit)",
          },
        });
        clearTimeout(timeoutId);

        const headers = res.headers;

        // 1. Check Missing Security Headers
        const requiredHeaders = [
          {
            name: "strict-transport-security",
            title: "Missing HTTP Strict Transport Security (HSTS)",
            severity: "medium" as const,
            cvss: 4.5,
            cwe: "CWE-319",
            description: "Strict-Transport-Security header is not present on the HTTPS service.",
          },
          {
            name: "content-security-policy",
            title: "Missing Content Security Policy (CSP)",
            severity: "medium" as const,
            cvss: 5.0,
            cwe: "CWE-1021",
            description: "No Content-Security-Policy header defined to restrict script execution and prevent XSS.",
          },
          {
            name: "x-frame-options",
            title: "Missing Anti-Clickjacking Header (X-Frame-Options)",
            severity: "low" as const,
            cvss: 3.4,
            cwe: "CWE-1021",
            description: "X-Frame-Options header missing; target may be framed in clickjacking scenarios.",
          },
          {
            name: "x-content-type-options",
            title: "Missing X-Content-Type-Options: nosniff",
            severity: "low" as const,
            cvss: 3.1,
            cwe: "CWE-16",
            description: "MIME-sniffing protection header is missing, allowing browser to guess MIME types.",
          },
        ];

        for (const reqHeader of requiredHeaders) {
          if (!headers.has(reqHeader.name)) {
            findings.push({
              assetIp: asset.ip,
              servicePort: asset.services[0]?.port || 443,
              source: "passive",
              sourceId: `PASSIVE-HDR-${reqHeader.name.toUpperCase()}`,
              title: reqHeader.title,
              description: reqHeader.description,
              cwe: reqHeader.cwe,
              cvss: reqHeader.cvss,
              severity: reqHeader.severity,
              evidence: {
                testedUrl: targetUrl,
                status: res.status,
                missingHeader: reqHeader.name,
              },
            });
          }
        }

        // 2. Information Disclosure via Server / Powered-By
        const serverHeader = headers.get("server");
        const poweredBy = headers.get("x-powered-by");

        if (serverHeader || poweredBy) {
          findings.push({
            assetIp: asset.ip,
            servicePort: asset.services[0]?.port || 443,
            source: "passive",
            sourceId: "PASSIVE-INFO-BANNER",
            title: "Server Technology Banner Disclosure",
            description: `The application leaks technology stack versions via HTTP response headers (Server: ${serverHeader || "none"}, X-Powered-By: ${poweredBy || "none"}).`,
            cwe: "CWE-200",
            cvss: 2.6,
            severity: "low",
            evidence: {
              server: serverHeader,
              xPoweredBy: poweredBy,
            },
          });
        }

        // 3. Insecure Cookies check
        const setCookie = headers.get("set-cookie");
        if (setCookie) {
          const isSecure = /secure/i.test(setCookie);
          const isHttpOnly = /httponly/i.test(setCookie);
          const hasSameSite = /samesite/i.test(setCookie);

          if (!isSecure || !isHttpOnly || !hasSameSite) {
            findings.push({
              assetIp: asset.ip,
              servicePort: asset.services[0]?.port || 443,
              source: "passive",
              sourceId: "PASSIVE-COOKIE-FLAGS",
              title: "Insecure Cookie Flag Configuration",
              description: `Session cookie transmitted without recommended defense-in-depth flags: ${[
                !isSecure ? "Missing Secure" : null,
                !isHttpOnly ? "Missing HttpOnly" : null,
                !hasSameSite ? "Missing SameSite" : null,
              ]
                .filter(Boolean)
                .join(", ")}.`,
              cwe: "CWE-614",
              cvss: 4.8,
              severity: "medium",
              evidence: {
                rawCookieHeader: setCookie.split(";")[0] + "; [flags redacted]",
                secure: isSecure,
                httpOnly: isHttpOnly,
                sameSite: hasSameSite,
              },
            });
          }
        }

        // 4. Check robots.txt (polite check)
        try {
          const robotsRes = await fetch(`${targetUrl}/robots.txt`, {
            method: "GET",
            signal: AbortSignal.timeout(3000),
            headers: { "User-Agent": "AEHA-EthicalHackingAssistant-PassiveScanner/1.0" },
          });

          if (robotsRes.status === 200) {
            const body = await robotsRes.text();
            if (body.includes("Disallow:") && (body.includes("admin") || body.includes("api") || body.includes("secret"))) {
              findings.push({
                assetIp: asset.ip,
                servicePort: asset.services[0]?.port || 443,
                source: "passive",
                sourceId: "PASSIVE-ROBOTS-DISCLOSE",
                title: "Sensitive Path Disclosed in robots.txt",
                description: "The robots.txt file reveals potentially sensitive administrative or internal paths.",
                cwe: "CWE-200",
                cvss: 3.3,
                severity: "low",
                evidence: {
                  url: `${targetUrl}/robots.txt`,
                  sample: body.slice(0, 300),
                },
              });
            }
          }
        } catch {
          // polite ignore
        }
      } catch (err: any) {
        // Log safe scan completion or non-blocking connectivity issue
        console.warn(`Passive check for ${targetUrl} skipped: ${err.message}`);
      }
    }

    return findings;
  }
}
