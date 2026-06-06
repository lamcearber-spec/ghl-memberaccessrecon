import type { MemberAccessFinding, MemberAccessReport } from "./types";

export function toMemberAccessCsv(report: MemberAccessReport): string {
  return [
    ["contact", "contact_email", "offer", "payment_status", "access_status", "unlock_criteria", "source", "amount", "risk"],
    ...report.rows.map((row) => [
      row.contactName,
      row.contactEmail,
      row.offerName,
      row.paymentStatus,
      row.accessStatus,
      row.unlockCriteria,
      row.source,
      money(row.amountCents),
      row.risk
    ])
  ]
    .map(csvRow)
    .join("\n");
}

export function toMemberAccessFindingsCsv(report: MemberAccessReport): string {
  return [
    ["severity", "rule", "contact", "contact_email", "offer", "amount", "summary"],
    ...report.findings.map((finding) => findingRow(finding))
  ]
    .map(csvRow)
    .join("\n");
}

function findingRow(finding: MemberAccessFinding): string[] {
  return [finding.severity, finding.rule, finding.contactName, finding.contactEmail, finding.offerName, money(finding.amountCents), finding.summary];
}

function money(cents: number): string {
  return (cents / 100).toFixed(2);
}

function csvRow(values: string[]): string {
  return values.map(escapeCsv).join(",");
}

function escapeCsv(value: string): string {
  if (!/[",\n]/.test(value)) {
    return value;
  }

  return `"${value.replaceAll('"', '""')}"`;
}
