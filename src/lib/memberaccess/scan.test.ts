import { describe, expect, it } from "vitest";
import type { InstallationStore, MarketplaceInstallation } from "@/lib/store/installations";
import { scanMemberAccess } from "./scan";

const installation: MarketplaceInstallation = {
  id: "company-1",
  companyId: "company-1",
  userType: "Company",
  accessToken: "live-token",
  refreshToken: "refresh-token",
  expiresAt: "2026-06-06T17:00:00.000Z",
  scopes: ["payments/subscriptions.readonly", "payments/transactions.readonly", "contacts.readonly", "products.readonly"],
  createdAt: "2026-06-06T16:00:00.000Z",
  updatedAt: "2026-06-06T16:00:00.000Z"
};

describe("scanMemberAccess", () => {
  it("returns a fixture-backed report when no installation is available", async () => {
    const scan = await scanMemberAccess({}, { store: emptyStore() });

    expect(scan.mode).toBe("fixture");
    expect(scan.report.agencyName).toBe("Radom Force");
    expect(scan.rosterCsv).toContain("contact,contact_email,offer");
    expect(scan.findingsCsv).toContain("ghost-access");
  });

  it("uses a live installation and client factory when installationId is provided", async () => {
    const scan = await scanMemberAccess(
      { installationId: "company-1" },
      {
        store: storeWith(installation),
        clientFactory: (token) => ({
          buildMemberAccessSource: async () => ({
            agencyName: `Token ${token}`,
            generatedAt: "2026-06-06T16:00:00.000Z",
            contacts: [{ id: "c-live", name: "Live Member", email: "live@example.com" }],
            payments: [],
            access: [
              {
                id: "a-live",
                contactId: "c-live",
                offerId: "offer-live",
                offerName: "Live Course",
                source: "csv-import",
                grantedAt: "2026-06-01T10:00:00.000Z",
                unlockCriteria: "manual"
              }
            ]
          })
        })
      }
    );

    expect(scan.mode).toBe("live");
    expect(scan.report.agencyName).toBe("Token live-token");
    expect(scan.report.rows[0].contactEmail).toBe("live@example.com");
  });
});

function emptyStore(): InstallationStore {
  return {
    get: async () => undefined,
    save: async () => undefined
  };
}

function storeWith(value: MarketplaceInstallation): InstallationStore {
  return {
    get: async (id) => (id === value.id ? value : undefined),
    save: async () => undefined
  };
}
