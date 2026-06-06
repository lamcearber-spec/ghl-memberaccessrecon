import { describe, expect, it } from "vitest";
import { buildMemberAccessReport } from "./model";
import type { MemberAccessSource } from "./types";

const source: MemberAccessSource = {
  agencyName: "Radom Force",
  generatedAt: "2026-06-06T16:00:00.000Z",
  contacts: [
    { id: "c-ghost", name: "Ghost Member", email: "ghost@example.com" },
    { id: "c-paid", name: "Paid Locked", email: "paid@example.com" },
    { id: "c-expired", name: "Expired Holder", email: "expired@example.com" },
    { id: "c-overlap", name: "Overlap Student", email: "overlap@example.com" }
  ],
  payments: [
    {
      id: "sub-ghost",
      contactId: "c-ghost",
      offerId: "offer-core",
      offerName: "Core Course",
      status: "canceled",
      amountCents: 4900,
      currency: "USD",
      latestStatusAt: "2026-06-01T10:00:00.000Z"
    },
    {
      id: "sub-paid",
      contactId: "c-paid",
      offerId: "offer-pro",
      offerName: "Pro Membership",
      status: "active",
      amountCents: 9900,
      currency: "USD",
      latestStatusAt: "2026-06-05T10:00:00.000Z"
    },
    {
      id: "sub-overlap",
      contactId: "c-overlap",
      offerId: "offer-overlap-a",
      offerName: "Agency Academy Monthly",
      status: "active",
      amountCents: 7900,
      currency: "USD",
      latestStatusAt: "2026-06-05T10:00:00.000Z"
    }
  ],
  access: [
    {
      id: "access-ghost",
      contactId: "c-ghost",
      offerId: "offer-core",
      offerName: "Core Course",
      productId: "course-core",
      source: "live",
      grantedAt: "2026-05-01T10:00:00.000Z",
      unlockCriteria: "all-members"
    },
    {
      id: "access-expired",
      contactId: "c-expired",
      offerId: "offer-old",
      offerName: "Old Promo Course",
      productId: "course-old",
      source: "csv-import",
      grantedAt: "2025-12-01T10:00:00.000Z",
      expiresAt: "2026-05-30T00:00:00.000Z",
      unlockCriteria: "paid"
    },
    {
      id: "access-overlap-a",
      contactId: "c-overlap",
      offerId: "offer-overlap-a",
      offerName: "Agency Academy Monthly",
      productId: "academy",
      source: "live",
      grantedAt: "2026-06-01T10:00:00.000Z",
      unlockCriteria: "paid"
    },
    {
      id: "access-overlap-b",
      contactId: "c-overlap",
      offerId: "offer-overlap-b",
      offerName: "Agency Academy Annual Bonus",
      productId: "academy",
      source: "live",
      grantedAt: "2026-06-01T10:00:00.000Z",
      unlockCriteria: "time-unlock"
    }
  ]
};

describe("buildMemberAccessReport", () => {
  it("reconciles payment state against course access and flags ghost access work", () => {
    const report = buildMemberAccessReport(source, { now: "2026-06-06T16:00:00.000Z" });

    expect(report.totals).toEqual({
      contacts: 4,
      accessRows: 4,
      paymentRows: 3,
      ghostAccess: 2,
      lockedOut: 1,
      silentRevokeRisks: 2,
      duplicateOverlaps: 1,
      findings: 7,
      revenueAtRiskCents: 4900
    });

    expect(report.findings.map((finding) => finding.rule)).toEqual([
      "ghost-access",
      "ghost-access",
      "locked-out",
      "expired-access",
      "silent-revoke-risk",
      "silent-revoke-risk",
      "duplicate-overlap"
    ]);
    expect(report.findings.find((finding) => finding.contactEmail === "ghost@example.com" && finding.rule === "ghost-access")).toEqual(
      expect.objectContaining({
        contactEmail: "ghost@example.com",
        offerName: "Core Course",
        severity: "critical",
        rule: "ghost-access",
        amountCents: 4900
      })
    );
    expect(report.findings.find((finding) => finding.rule === "locked-out")).toEqual(
      expect.objectContaining({
        contactEmail: "paid@example.com",
        offerName: "Pro Membership",
        severity: "critical"
      })
    );
  });

  it("creates a stable evidence hash independent of source ordering", () => {
    const first = buildMemberAccessReport(source, { now: "2026-06-06T16:00:00.000Z" });
    const reordered = buildMemberAccessReport(
      {
        ...source,
        contacts: [...source.contacts].reverse(),
        payments: [...source.payments].reverse(),
        access: [...source.access].reverse()
      },
      { now: "2026-06-06T16:00:00.000Z" }
    );

    expect(first.contentHash).toMatch(/^[a-f0-9]{64}$/);
    expect(reordered.contentHash).toBe(first.contentHash);
  });
});
