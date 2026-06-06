import { describe, expect, it } from "vitest";
import { demoMemberAccessReport } from "./fixtures";
import { renderMemberAccessPdf } from "./pdf";

describe("MemberAccessRecon PDF", () => {
  it("renders a downloadable ghost-access evidence PDF", async () => {
    const pdf = await renderMemberAccessPdf(demoMemberAccessReport);

    expect(pdf.subarray(0, 4).toString("ascii")).toBe("%PDF");
    expect(pdf.byteLength).toBeGreaterThan(1000);
  });
});
