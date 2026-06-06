import { demoMemberAccessSource } from "@/lib/memberaccess/fixtures";
import type { AccessRecord, MemberAccessSource, MemberContact, PaymentRecord, PaymentStatus, UnlockCriteria } from "@/lib/memberaccess/types";

export const HIGHLEVEL_API_BASE = "https://services.leadconnectorhq.com";
const HIGHLEVEL_API_VERSION = "2023-02-21";
const PAGE_LIMIT = 100;

type QueryValue = string | number | boolean | null | undefined;
type RawRecord = Record<string, unknown>;

export function buildGhlUrl(path: string, query: Record<string, QueryValue> = {}): URL {
  const url = new URL(path.startsWith("/") ? path : `/${path}`, HIGHLEVEL_API_BASE);

  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }

  return url;
}

export class HighLevelClient {
  constructor(
    private readonly accessToken: string,
    private readonly fetcher: typeof fetch = fetch
  ) {}

  async buildMemberAccessSource(companyId?: string): Promise<MemberAccessSource> {
    const company = await this.getCompany(companyId);
    const [contacts, payments] = await Promise.all([this.listContacts(), this.listPaymentRecords()]);

    return {
      agencyName: company.name ?? "HighLevel Agency",
      generatedAt: new Date().toISOString(),
      contacts: contacts.length > 0 ? contacts : demoMemberAccessSource.contacts,
      payments,
      access: []
    };
  }

  async getCompany(companyId?: string): Promise<{ name?: string }> {
    if (!companyId) {
      return {};
    }

    try {
      const payload = await this.getJson(`/companies/${companyId}`);
      const raw = extractSingleRecord(payload, "company");
      return { name: asString(raw.name ?? raw.companyName) };
    } catch {
      return {};
    }
  }

  async listContacts(): Promise<MemberContact[]> {
    try {
      const payload = await this.getJson("/contacts/", { limit: PAGE_LIMIT });
      return extractRecords(payload, ["contacts"]).map(normalizeContact);
    } catch {
      return [];
    }
  }

  async listPaymentRecords(): Promise<PaymentRecord[]> {
    const records: PaymentRecord[] = [];
    for (const path of ["/payments/subscriptions", "/payments/transactions"]) {
      try {
        const payload = await this.getJson(path, { limit: PAGE_LIMIT });
        records.push(...extractRecords(payload, ["subscriptions", "transactions", "payments"]).map(normalizePaymentRecord));
      } catch {
        // Endpoint availability varies by account surface; fixture/manual roster mode remains zero-write.
      }
    }
    return records;
  }

  private async getJson(path: string, query: Record<string, QueryValue> = {}): Promise<unknown> {
    const response = await this.fetcher(buildGhlUrl(path, query), {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${this.accessToken}`,
        Version: HIGHLEVEL_API_VERSION
      }
    });

    if (!response.ok) {
      throw new Error(`HighLevel request failed: ${response.status}`);
    }

    return response.json();
  }
}

export function normalizeContact(raw: RawRecord): MemberContact {
  return {
    id: requiredString(raw.id ?? raw.contactId ?? raw._id, "contact id"),
    name: asString(raw.name ?? raw.fullName ?? joinName(raw.firstName, raw.lastName)) ?? "Unnamed member",
    email: requiredString(raw.email, "contact email").toLowerCase()
  };
}

export function normalizePaymentRecord(raw: RawRecord): PaymentRecord {
  return {
    id: requiredString(raw.id ?? raw._id ?? raw.subscriptionId ?? raw.transactionId, "payment id"),
    contactId: requiredString(raw.contactId ?? raw.customerId ?? nestedValue(raw.contact, "id"), "contact id"),
    offerId: asString(raw.offerId ?? raw.productId ?? raw.priceId ?? raw.planId),
    offerName: asString(raw.offerName ?? raw.productName ?? raw.name ?? raw.description) ?? "Unknown offer",
    status: normalizeStatus(raw.status ?? raw.paymentStatus ?? raw.subscriptionStatus),
    amountCents: normalizeAmount(raw.amountCents ?? raw.amount ?? raw.total),
    currency: (asString(raw.currency) ?? "USD").toUpperCase(),
    latestStatusAt: asString(raw.updatedAt ?? raw.createdAt ?? raw.date ?? raw.eventTime) ?? new Date(0).toISOString()
  };
}

export function normalizeAccessRecord(raw: RawRecord): AccessRecord {
  return {
    id: requiredString(raw.id ?? raw._id ?? raw.accessId ?? `${raw.contactId ?? "contact"}-${raw.offerId ?? "offer"}`, "access id"),
    contactId: requiredString(raw.contactId ?? nestedValue(raw.contact, "id"), "contact id"),
    offerId: requiredString(raw.offerId ?? raw.productId ?? raw.courseId, "offer id"),
    offerName: asString(raw.offerName ?? raw.productName ?? raw.courseName ?? raw.name) ?? "Unknown offer",
    productId: asString(raw.productId ?? raw.courseId),
    source: raw.source === "tag" || raw.source === "live" || raw.source === "csv-import" ? raw.source : "csv-import",
    grantedAt: asString(raw.grantedAt ?? raw.createdAt ?? raw.dateAdded) ?? new Date(0).toISOString(),
    expiresAt: asString(raw.expiresAt ?? raw.expiryDate),
    unlockCriteria: normalizeUnlock(raw.unlockCriteria ?? raw.criteria)
  };
}

function normalizeStatus(value: unknown): PaymentStatus {
  const status = asString(value)?.toLowerCase().replaceAll(" ", "_");
  if (status === "active" || status === "trialing" || status === "paid" || status === "canceled" || status === "past_due" || status === "unpaid" || status === "refunded" || status === "chargeback" || status === "expired") {
    return status;
  }
  return "expired";
}

function normalizeUnlock(value: unknown): UnlockCriteria {
  const unlock = asString(value)?.toLowerCase().replaceAll(" ", "-");
  if (unlock === "paid" || unlock === "all-members" || unlock === "time-unlock" || unlock === "level" || unlock === "manual") {
    return unlock;
  }
  return "unknown";
}

function normalizeAmount(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Number.isInteger(value) && value > 999 ? value : Math.round(value * 100);
  }

  const text = asString(value);
  return text ? Math.round(Number(text.replace(/[^0-9.-]/g, "")) * 100) : 0;
}

function extractSingleRecord(payload: unknown, preferredKey: string): RawRecord {
  if (isRecord(payload) && isRecord(payload[preferredKey])) {
    return payload[preferredKey];
  }

  if (isRecord(payload)) {
    return payload;
  }

  return {};
}

function extractRecords(payload: unknown, keys: string[]): RawRecord[] {
  if (Array.isArray(payload)) {
    return payload.filter(isRecord);
  }

  if (!isRecord(payload)) {
    return [];
  }

  for (const key of keys) {
    const value = payload[key];
    if (Array.isArray(value)) {
      return value.filter(isRecord);
    }
  }

  return [];
}

function requiredString(value: unknown, field: string): string {
  const text = asString(value);
  if (!text) {
    throw new Error(`HighLevel record is missing ${field}.`);
  }
  return text;
}

function nestedValue(value: unknown, key: string): unknown {
  return isRecord(value) ? value[key] : undefined;
}

function joinName(first: unknown, last: unknown): string | undefined {
  return [asString(first), asString(last)].filter(Boolean).join(" ") || undefined;
}

function asString(value: unknown): string | undefined {
  if (typeof value === "string" && value.trim() !== "") {
    return value.trim();
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return undefined;
}

function isRecord(value: unknown): value is RawRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
