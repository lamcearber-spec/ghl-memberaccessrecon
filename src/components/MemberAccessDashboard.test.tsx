import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { demoMemberAccessReport } from "@/lib/memberaccess/fixtures";
import { MemberAccessDashboard } from "./MemberAccessDashboard";

describe("MemberAccessDashboard", () => {
  it("renders ghost-access findings, roster rows, and export actions", () => {
    render(<MemberAccessDashboard report={demoMemberAccessReport} mode="fixture" />);

    expect(screen.getByRole("heading", { name: /memberaccessrecon/i })).toBeInTheDocument();
    expect(screen.getAllByText(/ghost access/i).length).toBeGreaterThan(1);
    expect(screen.getAllByText(/ghost@example.com/i).length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: /download pdf/i })).toHaveAttribute("href", "/api/report/pdf");
    expect(screen.getByRole("link", { name: /download roster/i })).toHaveAttribute("download", "memberaccessrecon-roster.csv");
  });
});
