import { MemberAccessDashboard } from "@/components/MemberAccessDashboard";
import { scanMemberAccess } from "@/lib/memberaccess/scan";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function Home({ searchParams }: { searchParams?: Promise<SearchParams> | SearchParams } = {}) {
  const params = searchParams ? await searchParams : {};
  const scan = await scanMemberAccess({
    installationId: firstParam(params.installationId)
  });

  return <MemberAccessDashboard report={scan.report} mode={scan.mode} pdfUrl={pdfUrl(params)} />;
}

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function pdfUrl(params: SearchParams): string {
  const query = new URLSearchParams();
  const installationId = firstParam(params.installationId);
  if (installationId) {
    query.set("installationId", installationId);
  }

  const queryString = query.toString();
  return queryString ? `/api/report/pdf?${queryString}` : "/api/report/pdf";
}
