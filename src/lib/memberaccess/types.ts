export type PaymentStatus = "active" | "trialing" | "paid" | "canceled" | "past_due" | "unpaid" | "refunded" | "chargeback" | "expired";
export type AccessSource = "live" | "csv-import" | "tag";
export type UnlockCriteria = "paid" | "all-members" | "time-unlock" | "level" | "manual" | "unknown";
export type FindingSeverity = "critical" | "warning" | "info";

export type MemberContact = {
  id: string;
  name: string;
  email: string;
};

export type PaymentRecord = {
  id: string;
  contactId: string;
  offerId?: string;
  offerName: string;
  status: PaymentStatus;
  amountCents: number;
  currency: string;
  latestStatusAt: string;
};

export type AccessRecord = {
  id: string;
  contactId: string;
  offerId: string;
  offerName: string;
  productId?: string;
  source: AccessSource;
  grantedAt: string;
  expiresAt?: string;
  unlockCriteria: UnlockCriteria;
};

export type MemberAccessSource = {
  agencyName: string;
  generatedAt: string;
  contacts: MemberContact[];
  payments: PaymentRecord[];
  access: AccessRecord[];
};

export type MemberAccessOptions = {
  now?: string;
};

export type MemberAccessRisk = "ghost access" | "locked out" | "expired access" | "silent revoke risk" | "duplicate overlap" | "ok";

export type MemberAccessRow = {
  id: string;
  contactId: string;
  contactName: string;
  contactEmail: string;
  offerId: string;
  offerName: string;
  paymentStatus: PaymentStatus | "none";
  accessStatus: "live" | "missing" | "expired";
  unlockCriteria: UnlockCriteria;
  source: AccessSource | "payment";
  amountCents: number;
  currency: string;
  risk: MemberAccessRisk;
};

export type MemberAccessFindingRule =
  | "ghost-access"
  | "locked-out"
  | "expired-access"
  | "silent-revoke-risk"
  | "duplicate-overlap";

export type MemberAccessFinding = {
  id: string;
  rule: MemberAccessFindingRule;
  severity: FindingSeverity;
  contactId: string;
  contactName: string;
  contactEmail: string;
  offerName: string;
  amountCents: number;
  currency: string;
  summary: string;
};

export type MemberAccessReport = {
  agencyName: string;
  generatedAt: string;
  disclaimer: string;
  totals: {
    contacts: number;
    accessRows: number;
    paymentRows: number;
    ghostAccess: number;
    lockedOut: number;
    silentRevokeRisks: number;
    duplicateOverlaps: number;
    findings: number;
    revenueAtRiskCents: number;
  };
  rows: MemberAccessRow[];
  findings: MemberAccessFinding[];
  contentHash: string;
};
