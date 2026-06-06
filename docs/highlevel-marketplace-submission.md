# MemberAccessRecon HighLevel Marketplace Submission

## URLs

- Production app URL: `https://ghl-memberaccessrecon.vercel.app/`
- OAuth callback URL: `https://ghl-memberaccessrecon.vercel.app/api/ghl/callback`
- Privacy URL: `https://ghl-memberaccessrecon.vercel.app/privacy`
- Terms URL: `https://ghl-memberaccessrecon.vercel.app/terms`
- Support URL: `https://ghl-memberaccessrecon.vercel.app/support`

## App Identity

- App name: `MemberAccessRecon: Ghost Access Audit`
- HighLevel app ID: `6a24693a01623812f16f0f86`
- Submitted version/status: `1.0.0` / `review`
- Publish trace: `5699a2eb-cfa0-4fe0-bcf0-13f72534e4eb`
- Short name: `MemberAccessRecon`
- Category: Memberships
- Target user: Agency
- Short description: `Find ghost course access, locked-out paid members, and silent revoke risks across HighLevel memberships.`

## Long Description

MemberAccessRecon helps HighLevel agencies clean up paid membership drift. It compares payment, subscription, product, contact, and roster evidence to flag people who still have course or membership access after cancelation, refund, chargeback, or expiry, plus paying members who appear locked out.

The app is read-only. It exports CSV and PDF evidence packs for ghost access, locked-out paid members, duplicate overlaps, expired access, and silent revoke risks caused by broad unlock criteria such as all-members, level, or time-based unlocks. If live membership roster reads are limited, the app remains zero-write and supports a one-time CSV roster import path for historical cleanup.

Use it for membership audits, refund cleanup, course access drift, failed revoke investigations, agency client handoff evidence, and recurring paid-access reconciliation. MemberAccessRecon does not create, edit, delete, revoke, tag, or otherwise change contacts, payments, courses, memberships, offers, or HighLevel account settings.

## Search Keywords

`ghost access`, `course access audit`, `membership access`, `unpaid members`, `canceled subscriptions`, `refund access`, `GHL memberships`, `course revoke`, `locked out members`, `access drift`

## Scope Justification

- `contacts.readonly`: match payment and roster evidence to contact names and emails.
- `payments/subscriptions.readonly`: identify active, trialing, canceled, past-due, and expired paid membership subscriptions.
- `payments/transactions.readonly`: identify paid, refunded, chargeback, and failed payment evidence.
- `products.readonly`: map payment records to product, offer, and course names where available.

No write scopes are requested. The app never calls course revoke endpoints, never changes tags, and never mutates memberships.

## Reviewer Test Notes

The root dashboard renders fixture data before installation, so reviewers can inspect the report immediately. After OAuth install, the app stores encrypted tokens and reads available contact, product, payment, and subscription records on demand. PDF and CSV exports are available from the dashboard and from `/api/report` and `/api/report/pdf`.
