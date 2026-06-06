import { scanMemberAccess } from "@/lib/memberaccess/scan";
import { renderMemberAccessPdf } from "@/lib/memberaccess/pdf";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const scan = await scanMemberAccess({
    installationId: url.searchParams.get("installationId") ?? undefined
  });
  const pdf = await renderMemberAccessPdf(scan.report);

  return new Response(new Uint8Array(pdf), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="memberaccessrecon-${scan.report.generatedAt.slice(0, 10)}.pdf"`
    }
  });
}
