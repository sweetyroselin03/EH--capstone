import { ScannerAdapter, NormalizedAsset, NormalizedFinding } from "./types";

export class WorkerScanner implements ScannerAdapter {
  name = "WorkerScanner";

  async discover(scope: any[]): Promise<NormalizedAsset[]> {
    // When in worker mode, reconnaissance tasks are queued as jobs for the external lab worker
    // The worker runs nmap host discovery and pushes assets back via /api/worker/results
    return scope.map((s, idx) => ({
      hostname: s.type === "domain" ? s.value : undefined,
      ip: s.type === "ip" ? s.value : `lab-host-${idx + 1}`,
      criticality: s.criticality || 3,
      exposure: "internal",
      services: [],
    }));
  }

  async scan(_assets: NormalizedAsset[], _scope: any[]): Promise<NormalizedFinding[]> {
    // In worker mode, actual scanning execution is delegated to the worker daemon.
    // The findings are populated asynchronously when the worker posts results.
    return [];
  }
}
