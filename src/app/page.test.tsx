import { describe, expect, it, vi } from "vitest";
import Home from "./page";
import { scanMemberAccess } from "@/lib/memberaccess/scan";

vi.mock("@/lib/memberaccess/scan", () => ({
  scanMemberAccess: vi.fn(async () => ({
    mode: "fixture",
    report: {
      agencyName: "Test Agency",
      generatedAt: "2026-06-06T10:00:00.000Z",
      contentHash: "a".repeat(64),
      disclaimer: "Read-only report.",
      totals: {
        contacts: 1,
        accessRows: 0,
        paymentRows: 0,
        ghostAccess: 0,
        lockedOut: 0,
        silentRevokeRisks: 0,
        duplicateOverlaps: 0,
        findings: 0,
        revenueAtRiskCents: 0
      },
      rows: [],
      findings: []
    },
    rosterCsv: "",
    findingsCsv: ""
  }))
}));

describe("Home", () => {
  it("passes marketplace redirect params into the MemberAccessRecon scan", async () => {
    await Home({
      searchParams: Promise.resolve({
        installationId: "company-1"
      })
    });

    expect(scanMemberAccess).toHaveBeenCalledWith({
      installationId: "company-1"
    });
  });
});
