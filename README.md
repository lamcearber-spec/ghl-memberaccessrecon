# MemberAccessRecon: Ghost Access Audit for HighLevel

MemberAccessRecon is a read-only HighLevel Marketplace app for agencies that need to reconcile course or membership access against paid subscriptions, payments, refunds, and imported roster evidence.

## Marketplace Positioning

**Suggested app name:** MemberAccessRecon: Ghost Access Audit

**Short description:** Find ghost course access, locked-out paid members, and silent revoke risks across HighLevel memberships.

**Search terms to work into the listing:** ghost access, course access audit, membership access, unpaid members, canceled subscriptions, refund access, GHL memberships, course revoke, locked out members, access drift.

**Pricing:** HighLevel native billing. Free sample report, $39/mo for one location, $79/mo for up to 10 locations, $149/mo for agencies.

## Read-Only Scopes

- `contacts.readonly`
- `payments/subscriptions.readonly`
- `payments/transactions.readonly`
- `products.readonly`

No write scopes are used. The app never calls course revoke endpoints, never changes tags, and never mutates memberships.

## Local Development

```bash
pnpm install
pnpm dev
```

Open `http://localhost:3000`. The dashboard uses fixture mode until HighLevel OAuth credentials are configured and an `installationId` is present.

## Environment

Copy `.env.example` to `.env.local` and fill:

- `GHL_CLIENT_ID`
- `GHL_CLIENT_SECRET`
- `GHL_REDIRECT_URI`
- `APP_BASE_URL`
- `INSTALLATION_SECRET`
- `DATABASE_URL`

If `DATABASE_URL` is set, MemberAccessRecon stores encrypted OAuth tokens in Neon/Postgres. Without it, development uses memory storage.

## HighLevel Setup

Create a public Marketplace app, target agency/company installs, and configure the Custom Page URL to the deployed app root and the OAuth redirect URL to `/api/ghl/callback`.

The app reads payment, subscription, product, and contact records where available. For historical membership access that HighLevel does not expose through read APIs, the app keeps the workflow zero-write and supports one-time CSV roster evidence.

## Verification

```bash
pnpm test
pnpm typecheck
pnpm build
```
