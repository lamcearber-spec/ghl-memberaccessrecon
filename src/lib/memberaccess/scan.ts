import { HighLevelClient } from "@/lib/ghl/client";
import { getInstallationStore, type InstallationStore } from "@/lib/store/installations";
import { toMemberAccessCsv, toMemberAccessFindingsCsv } from "./export";
import { demoMemberAccessReport } from "./fixtures";
import { buildMemberAccessReport } from "./model";
import type { MemberAccessReport, MemberAccessSource } from "./types";

export type MemberAccessScanParams = {
  installationId?: string;
};

export type MemberAccessScan = {
  mode: "fixture" | "live";
  report: MemberAccessReport;
  rosterCsv: string;
  findingsCsv: string;
};

type MemberAccessClient = {
  buildMemberAccessSource(companyId?: string): Promise<MemberAccessSource>;
};

type ScanDependencies = {
  store?: InstallationStore;
  clientFactory?: (accessToken: string) => MemberAccessClient;
};

export async function scanMemberAccess(params: MemberAccessScanParams = {}, deps: ScanDependencies = {}): Promise<MemberAccessScan> {
  const store = deps.store ?? getInstallationStore();
  const installation = params.installationId ? await store.get(params.installationId) : undefined;

  if (!installation) {
    return buildScan("fixture", demoMemberAccessReport);
  }

  const clientFactory = deps.clientFactory ?? ((accessToken: string) => new HighLevelClient(accessToken));
  const source = await clientFactory(installation.accessToken).buildMemberAccessSource(installation.companyId);
  return buildScan("live", buildMemberAccessReport(source));
}

function buildScan(mode: MemberAccessScan["mode"], report: MemberAccessReport): MemberAccessScan {
  return {
    mode,
    report,
    rosterCsv: toMemberAccessCsv(report),
    findingsCsv: toMemberAccessFindingsCsv(report)
  };
}
