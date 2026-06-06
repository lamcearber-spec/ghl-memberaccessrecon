import { NextResponse } from "next/server";
import { scanMemberAccess } from "@/lib/memberaccess/scan";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const scan = await scanMemberAccess({
    installationId: url.searchParams.get("installationId") ?? undefined
  });

  return NextResponse.json(scan);
}
