import { describe, expect, it } from "vitest";
import { demoMemberAccessReport } from "./fixtures";
import { toMemberAccessCsv, toMemberAccessFindingsCsv } from "./export";

describe("MemberAccessRecon exports", () => {
  it("exports ghost-access findings and roster rows", () => {
    const rosterCsv = toMemberAccessCsv(demoMemberAccessReport);
    const findingsCsv = toMemberAccessFindingsCsv(demoMemberAccessReport);

    expect(rosterCsv.split("\n")[0]).toBe("contact,contact_email,offer,payment_status,access_status,unlock_criteria,source,amount,risk");
    expect(rosterCsv).toContain("Ghost Member,ghost@example.com,Core Course,canceled,live,all-members,live,49.00,ghost access");
    expect(findingsCsv.split("\n")[0]).toBe("severity,rule,contact,contact_email,offer,amount,summary");
    expect(findingsCsv).toContain("critical,ghost-access");
  });
});
