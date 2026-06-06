import PDFDocument from "pdfkit/js/pdfkit.standalone.js";
import type PDFKit from "pdfkit";
import type { MemberAccessFinding, MemberAccessReport } from "./types";

export async function renderMemberAccessPdf(report: MemberAccessReport): Promise<Buffer> {
  const doc = new PDFDocument({ margin: 42, size: "A4", bufferPages: true });
  const chunks: Buffer[] = [];
  doc.on("data", (chunk: Buffer) => chunks.push(chunk));

  title(doc, report);
  section(doc, "Reconciliation summary");
  fact(doc, "Agency", report.agencyName);
  fact(doc, "Generated", report.generatedAt);
  fact(doc, "Evidence hash", report.contentHash);
  fact(doc, "Ghost access", String(report.totals.ghostAccess));
  fact(doc, "Locked out paying members", String(report.totals.lockedOut));
  fact(doc, "Revenue at risk", money(report.totals.revenueAtRiskCents));

  section(doc, "Findings");
  for (const finding of report.findings) {
    findingBlock(doc, finding);
  }

  section(doc, "Roster worklist");
  for (const row of report.rows) {
    doc.fontSize(9).fillColor("#171717").text(`${row.contactEmail} · ${row.offerName} · ${row.risk}`);
    doc
      .fontSize(8)
      .fillColor("#60646c")
      .text(`Payment ${row.paymentStatus} · Access ${row.accessStatus} · ${row.unlockCriteria} · ${row.source}`)
      .moveDown(0.45);
  }

  section(doc, "Read-only limitation");
  doc.fontSize(9).fillColor("#60646c").text(report.disclaimer);

  doc.end();
  await new Promise<void>((resolve) => doc.on("end", resolve));
  return Buffer.concat(chunks);
}

function title(doc: PDFKit.PDFDocument, report: MemberAccessReport): void {
  doc.fontSize(10).fillColor("#7a2e0e").text("COURSE ACCESS / PAYMENT DRIFT REPORT", { characterSpacing: 0.5 });
  doc.moveDown(0.4);
  doc.fontSize(28).fillColor("#171717").text("MemberAccessRecon", { lineGap: 2 });
  doc.fontSize(11).fillColor("#60646c").text(`${report.agencyName} · ${report.generatedAt}`);
  doc.moveDown(1.2);
}

function section(doc: PDFKit.PDFDocument, label: string): void {
  doc.moveDown(0.8);
  doc.fontSize(13).fillColor("#201810").text(label);
  doc.moveTo(42, doc.y + 4).lineTo(553, doc.y + 4).strokeColor("#d8dee4").stroke();
  doc.moveDown(0.8);
}

function fact(doc: PDFKit.PDFDocument, label: string, value: string): void {
  doc.fontSize(8).fillColor("#60646c").text(label.toUpperCase());
  doc.fontSize(10).fillColor("#171717").text(value || "Not available").moveDown(0.45);
}

function findingBlock(doc: PDFKit.PDFDocument, finding: MemberAccessFinding): void {
  doc.fontSize(10).fillColor(finding.severity === "critical" ? "#b42318" : "#7a4b00").text(`${finding.severity.toUpperCase()} · ${finding.rule}`);
  doc.fontSize(9).fillColor("#171717").text(finding.summary);
  doc.fontSize(8).fillColor("#60646c").text(`${finding.contactName} · ${finding.contactEmail} · ${money(finding.amountCents)}`).moveDown(0.7);
}

function money(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}
