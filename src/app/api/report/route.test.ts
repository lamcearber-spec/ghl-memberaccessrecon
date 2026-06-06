import { describe, expect, it } from "vitest";
import { GET } from "./route";

describe("/api/report", () => {
  it("returns a fixture-backed MemberAccessRecon report with CSV exports", async () => {
    const response = await GET(new Request("https://memberaccessrecon.test/api/report"));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.mode).toBe("fixture");
    expect(payload.report.agencyName).toBe("Radom Force");
    expect(payload.rosterCsv).toContain("contact,contact_email,offer");
    expect(payload.findingsCsv).toContain("ghost-access");
  });
});
