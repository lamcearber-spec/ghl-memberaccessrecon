import { describe, expect, it } from "vitest";
import { GET } from "./route";

describe("/api/report/pdf", () => {
  it("returns a downloadable MemberAccessRecon PDF", async () => {
    const response = await GET(new Request("https://memberaccessrecon.test/api/report/pdf"));
    const body = Buffer.from(await response.arrayBuffer());

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("application/pdf");
    expect(response.headers.get("content-disposition")).toContain("memberaccessrecon");
    expect(body.subarray(0, 4).toString("ascii")).toBe("%PDF");
  });
});
