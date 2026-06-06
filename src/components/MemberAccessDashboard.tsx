import { ArrowDownToLine, ClipboardList, FileText, ShieldCheck, TriangleAlert, UsersRound } from "lucide-react";
import { toMemberAccessCsv, toMemberAccessFindingsCsv } from "@/lib/memberaccess/export";
import type { MemberAccessFinding, MemberAccessReport } from "@/lib/memberaccess/types";

type MemberAccessDashboardProps = {
  report: MemberAccessReport;
  mode: "fixture" | "live";
  pdfUrl?: string;
};

export function MemberAccessDashboard({ report, mode, pdfUrl = "/api/report/pdf" }: MemberAccessDashboardProps) {
  return (
    <main className="shell">
      <section className="topbar" aria-label="MemberAccessRecon summary">
        <div>
          <p className="eyebrow">Ghost access and locked-out member audit</p>
          <h1>MemberAccessRecon</h1>
          <p className="subcopy">
            Read-only reconciliation of HighLevel payments, subscriptions, and course access rosters for agencies cleaning up paid membership drift.
          </p>
        </div>
        <div className="mode-pill" title={mode === "fixture" ? "Demo audit is active until the app is installed." : "Live agency audit"}>
          <ShieldCheck size={16} aria-hidden="true" />
          {mode === "fixture" ? "Fixture audit" : "Live audit"}
        </div>
      </section>

      <div className="action-row" aria-label="Primary evidence downloads">
        <a className="csv-link primary-download" href={pdfUrl} download>
          <FileText size={15} aria-hidden="true" />
          Download PDF
        </a>
      </div>

      <section className="metrics" aria-label="Member access totals">
        <Metric label="Ghost access" value={String(report.totals.ghostAccess)} tone={report.totals.ghostAccess > 0 ? "risk" : "neutral"} />
        <Metric label="Locked out" value={String(report.totals.lockedOut)} tone={report.totals.lockedOut > 0 ? "risk" : "neutral"} />
        <Metric label="Revenue at risk" value={money(report.totals.revenueAtRiskCents)} tone={report.totals.revenueAtRiskCents > 0 ? "review" : "neutral"} />
      </section>

      <section className="notice" aria-label="Read-only limitation">
        <ShieldCheck size={18} aria-hidden="true" />
        <span>{report.disclaimer}</span>
      </section>

      <section className="table-grid evidence-grid" aria-label="Audit details">
        <div className="table-panel">
          <div className="table-head">
            <h2>
              <TriangleAlert size={18} aria-hidden="true" />
              Access drift findings
            </h2>
            <a className="csv-link" href={csvHref(toMemberAccessFindingsCsv(report))} download="memberaccessrecon-findings.csv">
              <ArrowDownToLine size={15} aria-hidden="true" />
              Download findings
            </a>
          </div>
          <div className="finding-list">
            {report.findings.map((finding) => (
              <Finding key={finding.id} finding={finding} />
            ))}
          </div>
        </div>

        <div className="table-panel">
          <div className="table-head">
            <h2>
              <ClipboardList size={18} aria-hidden="true" />
              Evidence hash
            </h2>
          </div>
          <p className="hash-text">{report.contentHash}</p>
          <p className="panel-copy">
            Pack generated for {report.agencyName} on {report.generatedAt}. The report diagnoses access drift and never calls revoke or mutates tags.
          </p>
        </div>
      </section>

      <section className="table-panel transcript-panel">
        <div className="table-head">
          <h2>
            <UsersRound size={18} aria-hidden="true" />
            Ghost-access cleanup roster
          </h2>
          <a className="csv-link" href={csvHref(toMemberAccessCsv(report))} download="memberaccessrecon-roster.csv">
            <ArrowDownToLine size={15} aria-hidden="true" />
            Download roster
          </a>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Member</th>
                <th>Offer</th>
                <th>Payment</th>
                <th>Access</th>
                <th>Unlock</th>
                <th>Risk</th>
              </tr>
            </thead>
            <tbody>
              {report.rows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <strong>{row.contactName}</strong>
                    <span className="cell-subtext">{row.contactEmail}</span>
                  </td>
                  <td>{row.offerName}</td>
                  <td>{row.paymentStatus}</td>
                  <td>{row.accessStatus}</td>
                  <td>{row.unlockCriteria}</td>
                  <td>
                    <span className={`badge badge-${row.risk === "ok" ? "ok" : row.risk === "ghost access" || row.risk === "locked out" ? "missing" : "review"}`}>
                      {row.risk}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone: "risk" | "review" | "neutral" }) {
  return (
    <div className={`metric metric-${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Finding({ finding }: { finding: MemberAccessFinding }) {
  return (
    <article className={`finding finding-${finding.severity}`}>
      <span className={`badge badge-${finding.severity === "critical" ? "missing" : "review"}`}>{finding.severity}</span>
      <h3>{finding.rule.replaceAll("-", " ")}</h3>
      <p>{finding.summary}</p>
    </article>
  );
}

function money(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function csvHref(csv: string): string {
  return `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;
}
