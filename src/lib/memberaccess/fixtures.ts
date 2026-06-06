import { buildMemberAccessReport } from "./model";
import type { MemberAccessSource } from "./types";

export const demoMemberAccessSource: MemberAccessSource = {
  agencyName: "Radom Force",
  generatedAt: "2026-06-06T16:00:00.000Z",
  contacts: [
    { id: "c-ghost", name: "Ghost Member", email: "ghost@example.com" },
    { id: "c-paid", name: "Paid Locked", email: "paid@example.com" },
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
      source: "csv-import",
      grantedAt: "2026-06-01T10:00:00.000Z",
      unlockCriteria: "time-unlock"
    }
  ]
};

export const demoMemberAccessReport = buildMemberAccessReport(demoMemberAccessSource, {
  now: "2026-06-06T16:00:00.000Z"
});
