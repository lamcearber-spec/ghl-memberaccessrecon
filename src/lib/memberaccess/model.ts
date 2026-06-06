import { createHash } from "node:crypto";
import type {
  AccessRecord,
  MemberAccessFinding,
  MemberAccessFindingRule,
  MemberAccessOptions,
  MemberAccessReport,
  MemberAccessRow,
  MemberAccessSource,
  MemberContact,
  PaymentRecord,
  PaymentStatus
} from "./types";

const ACTIVE_PAYMENT_STATUSES = new Set<PaymentStatus>(["active", "trialing", "paid"]);
const LOST_PAYMENT_STATUSES = new Set<PaymentStatus>(["canceled", "past_due", "unpaid", "refunded", "chargeback", "expired"]);
const SILENT_REVOKE_UNLOCKS = new Set(["all-members", "time-unlock", "level"]);

const RULE_RANK: Record<MemberAccessFindingRule, number> = {
  "ghost-access": 0,
  "locked-out": 1,
  "expired-access": 2,
  "silent-revoke-risk": 3,
  "duplicate-overlap": 4
};

export function buildMemberAccessReport(source: MemberAccessSource, options: MemberAccessOptions = {}): MemberAccessReport {
  const now = new Date(options.now ?? source.generatedAt);
  const contacts = sortBy(source.contacts, (contact) => contact.id);
  const contactById = new Map(contacts.map((contact) => [contact.id, contact]));
  const access = sortBy(source.access, (item) => `${item.contactId}-${item.offerId}-${item.id}`);
  const payments = sortBy(source.payments, (item) => `${item.contactId}-${item.offerId ?? ""}-${item.id}`);
  const findings = sortFindings([
    ...ghostAccessFindings(access, payments, contactById),
    ...lockedOutFindings(payments, access, contactById),
    ...expiredAccessFindings(access, payments, contactById, now),
    ...silentRevokeFindings(access, payments, contactById, now),
    ...duplicateOverlapFindings(access, contactById)
  ]);
  const rows = sortRows([
    ...access.map((item) => accessRow(item, bestPayment(item, payments), contactById, now, findings)),
    ...payments
      .filter((payment) => ACTIVE_PAYMENT_STATUSES.has(payment.status) && !hasMatchingAccess(payment, access, now))
      .map((payment) => paymentOnlyRow(payment, contactById))
  ]);

  const reportWithoutHash = {
    agencyName: source.agencyName,
    generatedAt: source.generatedAt,
    disclaimer:
      "Read-only report. Forward-captured tags and live roster reads can miss pre-install or migrated access unless a one-time CSV roster is imported.",
    totals: {
      contacts: contacts.length,
      accessRows: access.length,
      paymentRows: payments.length,
      ghostAccess: findings.filter((finding) => finding.rule === "ghost-access").length,
      lockedOut: findings.filter((finding) => finding.rule === "locked-out").length,
      silentRevokeRisks: findings.filter((finding) => finding.rule === "silent-revoke-risk").length,
      duplicateOverlaps: findings.filter((finding) => finding.rule === "duplicate-overlap").length,
      findings: findings.length,
      revenueAtRiskCents: findings.filter((finding) => finding.rule === "ghost-access").reduce((sum, finding) => sum + finding.amountCents, 0)
    },
    rows,
    findings
  };

  return {
    ...reportWithoutHash,
    contentHash: hashReport(reportWithoutHash)
  };
}

function ghostAccessFindings(
  access: AccessRecord[],
  payments: PaymentRecord[],
  contactById: Map<string, MemberContact>
): MemberAccessFinding[] {
  return access
    .filter((item) => !ACTIVE_PAYMENT_STATUSES.has(bestPayment(item, payments)?.status ?? "expired"))
    .map((item) => {
      const payment = bestPayment(item, payments);
      const contact = contactFor(item.contactId, contactById);
      return {
        id: `${item.id}-ghost-access`,
        rule: "ghost-access",
        severity: "critical",
        contactId: item.contactId,
        contactName: contact.name,
        contactEmail: contact.email,
        offerName: item.offerName,
        amountCents: payment?.amountCents ?? 0,
        currency: payment?.currency ?? "USD",
        summary: `${contact.email} still has access to ${item.offerName} but payment status is ${payment?.status ?? "none"}.`
      };
    });
}

function lockedOutFindings(
  payments: PaymentRecord[],
  access: AccessRecord[],
  contactById: Map<string, MemberContact>
): MemberAccessFinding[] {
  return payments
    .filter((payment) => ACTIVE_PAYMENT_STATUSES.has(payment.status) && !hasMatchingAccess(payment, access, new Date("9999-01-01T00:00:00.000Z")))
    .map((payment) => {
      const contact = contactFor(payment.contactId, contactById);
      return {
        id: `${payment.id}-locked-out`,
        rule: "locked-out",
        severity: "critical",
        contactId: payment.contactId,
        contactName: contact.name,
        contactEmail: contact.email,
        offerName: payment.offerName,
        amountCents: payment.amountCents,
        currency: payment.currency,
        summary: `${contact.email} is paying for ${payment.offerName} but no matching live access row was found.`
      };
    });
}

function expiredAccessFindings(
  access: AccessRecord[],
  payments: PaymentRecord[],
  contactById: Map<string, MemberContact>,
  now: Date
): MemberAccessFinding[] {
  return access
    .filter((item) => isExpired(item, now) && !ACTIVE_PAYMENT_STATUSES.has(bestPayment(item, payments)?.status ?? "expired"))
    .map((item) => {
      const contact = contactFor(item.contactId, contactById);
      return {
        id: `${item.id}-expired-access`,
        rule: "expired-access",
        severity: "warning",
        contactId: item.contactId,
        contactName: contact.name,
        contactEmail: contact.email,
        offerName: item.offerName,
        amountCents: bestPayment(item, payments)?.amountCents ?? 0,
        currency: bestPayment(item, payments)?.currency ?? "USD",
        summary: `${contact.email} remains in the roster for ${item.offerName} after the recorded access expiry.`
      };
    });
}

function silentRevokeFindings(
  access: AccessRecord[],
  payments: PaymentRecord[],
  contactById: Map<string, MemberContact>,
  now: Date
): MemberAccessFinding[] {
  const duplicateKeys = duplicateAccessKeys(access);

  return access
    .filter((item) => {
      const payment = bestPayment(item, payments);
      const duplicateOverlap = duplicateKeys.has(accessKey(item));
      return ((payment ? LOST_PAYMENT_STATUSES.has(payment.status) : isExpired(item, now)) || duplicateOverlap) && SILENT_REVOKE_UNLOCKS.has(item.unlockCriteria);
    })
    .map((item) => {
      const contact = contactFor(item.contactId, contactById);
      const payment = bestPayment(item, payments);
      return {
        id: `${item.id}-silent-revoke-risk`,
        rule: "silent-revoke-risk",
        severity: "warning",
        contactId: item.contactId,
        contactName: contact.name,
        contactEmail: contact.email,
        offerName: item.offerName,
        amountCents: payment?.amountCents ?? 0,
        currency: payment?.currency ?? "USD",
        summary: `${item.offerName} uses ${item.unlockCriteria}; native revoke can silently no-op while access remains.`
      };
    });
}

function duplicateOverlapFindings(access: AccessRecord[], contactById: Map<string, MemberContact>): MemberAccessFinding[] {
  const groups = new Map<string, AccessRecord[]>();
  for (const item of access) {
    groups.set(accessKey(item), [...(groups.get(accessKey(item)) ?? []), item]);
  }

  return [...groups.values()]
    .filter((items) => items.length > 1)
    .map((items) => {
      const contact = contactFor(items[0].contactId, contactById);
      return {
        id: `${items[0].contactId}-${items[0].productId ?? items[0].offerId}-duplicate-overlap`,
        rule: "duplicate-overlap",
        severity: "warning",
        contactId: items[0].contactId,
        contactName: contact.name,
        contactEmail: contact.email,
        offerName: items.map((item) => item.offerName).join(" + "),
        amountCents: 0,
        currency: "USD",
        summary: `${contact.email} has ${items.length} overlapping access rows for the same product surface.`
      };
    });
}

function duplicateAccessKeys(access: AccessRecord[]): Set<string> {
  const groups = new Map<string, number>();
  for (const item of access) {
    groups.set(accessKey(item), (groups.get(accessKey(item)) ?? 0) + 1);
  }
  return new Set([...groups.entries()].filter(([, count]) => count > 1).map(([key]) => key));
}

function accessKey(access: AccessRecord): string {
  return `${access.contactId}:${access.productId ?? access.offerId}`;
}

function accessRow(
  access: AccessRecord,
  payment: PaymentRecord | undefined,
  contactById: Map<string, MemberContact>,
  now: Date,
  findings: MemberAccessFinding[]
): MemberAccessRow {
  const contact = contactFor(access.contactId, contactById);
  const matchingRules = findings.filter((finding) => finding.contactId === access.contactId && finding.offerName.includes(access.offerName)).map((finding) => finding.rule);
  return {
    id: access.id,
    contactId: access.contactId,
    contactName: contact.name,
    contactEmail: contact.email,
    offerId: access.offerId,
    offerName: access.offerName,
    paymentStatus: payment?.status ?? "none",
    accessStatus: isExpired(access, now) ? "expired" : "live",
    unlockCriteria: access.unlockCriteria,
    source: access.source,
    amountCents: payment?.amountCents ?? 0,
    currency: payment?.currency ?? "USD",
    risk: matchingRules.includes("ghost-access")
      ? "ghost access"
      : matchingRules.includes("expired-access")
        ? "expired access"
        : matchingRules.includes("duplicate-overlap")
          ? "duplicate overlap"
          : "ok"
  };
}

function paymentOnlyRow(payment: PaymentRecord, contactById: Map<string, MemberContact>): MemberAccessRow {
  const contact = contactFor(payment.contactId, contactById);
  return {
    id: payment.id,
    contactId: payment.contactId,
    contactName: contact.name,
    contactEmail: contact.email,
    offerId: payment.offerId ?? payment.id,
    offerName: payment.offerName,
    paymentStatus: payment.status,
    accessStatus: "missing",
    unlockCriteria: "unknown",
    source: "payment",
    amountCents: payment.amountCents,
    currency: payment.currency,
    risk: "locked out"
  };
}

function bestPayment(access: AccessRecord, payments: PaymentRecord[]): PaymentRecord | undefined {
  return payments.find((payment) => payment.contactId === access.contactId && payment.offerId === access.offerId) ?? payments.find((payment) => payment.contactId === access.contactId);
}

function hasMatchingAccess(payment: PaymentRecord, access: AccessRecord[], now: Date): boolean {
  return access.some((item) => item.contactId === payment.contactId && (!payment.offerId || item.offerId === payment.offerId) && !isExpired(item, now));
}

function isExpired(access: AccessRecord, now: Date): boolean {
  return access.expiresAt ? new Date(access.expiresAt).getTime() < now.getTime() : false;
}

function contactFor(contactId: string, contactById: Map<string, MemberContact>): MemberContact {
  return contactById.get(contactId) ?? { id: contactId, name: "Unknown member", email: "unknown@example.com" };
}

function sortRows(rows: MemberAccessRow[]): MemberAccessRow[] {
  return sortBy(rows, (row) => `${riskRank(row.risk)}-${row.contactEmail}-${row.offerName}`);
}

function sortFindings(findings: MemberAccessFinding[]): MemberAccessFinding[] {
  return [...findings].sort((left, right) => {
    const rankDelta = RULE_RANK[left.rule] - RULE_RANK[right.rule];
    if (rankDelta !== 0) {
      return rankDelta;
    }
    return `${left.contactEmail}-${left.offerName}-${left.id}`.localeCompare(`${right.contactEmail}-${right.offerName}-${right.id}`);
  });
}

function riskRank(risk: MemberAccessRow["risk"]): number {
  return ["ghost access", "locked out", "expired access", "silent revoke risk", "duplicate overlap", "ok"].indexOf(risk);
}

function sortBy<T>(items: T[], key: (item: T) => string): T[] {
  return [...items].sort((left, right) => key(left).localeCompare(key(right)));
}

function hashReport(report: Omit<MemberAccessReport, "contentHash">): string {
  return createHash("sha256").update(JSON.stringify(report)).digest("hex");
}
