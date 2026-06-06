import { describe, expect, it } from "vitest";
import { buildGhlUrl, normalizeAccessRecord, normalizePaymentRecord } from "./client";

describe("HighLevel MemberAccessRecon client", () => {
  it("builds versioned HighLevel URLs without empty query values", () => {
    const url = buildGhlUrl("/oauth/installedLocations", { companyId: "company-1", limit: 100, cursor: "" });

    expect(url.toString()).toBe("https://services.leadconnectorhq.com/oauth/installedLocations?companyId=company-1&limit=100");
  });

  it("normalizes payment records and imported access roster rows", () => {
    expect(
      normalizePaymentRecord({
        id: "sub-1",
        contactId: "contact-1",
        offerId: "offer-1",
        offerName: "Core Course",
        status: "past_due",
        amount: 49,
        currency: "usd",
        updatedAt: "2026-06-06T10:00:00.000Z"
      })
    ).toEqual({
      id: "sub-1",
      contactId: "contact-1",
      offerId: "offer-1",
      offerName: "Core Course",
      status: "past_due",
      amountCents: 4900,
      currency: "USD",
      latestStatusAt: "2026-06-06T10:00:00.000Z"
    });
    expect(
      normalizeAccessRecord({
        id: "access-1",
        contactId: "contact-1",
        offerId: "offer-1",
        offerName: "Core Course",
        productId: "course-core",
        source: "csv-import",
        grantedAt: "2026-06-01T10:00:00.000Z",
        unlockCriteria: "all-members"
      })
    ).toEqual({
      id: "access-1",
      contactId: "contact-1",
      offerId: "offer-1",
      offerName: "Core Course",
      productId: "course-core",
      source: "csv-import",
      grantedAt: "2026-06-01T10:00:00.000Z",
      unlockCriteria: "all-members"
    });
  });
});
