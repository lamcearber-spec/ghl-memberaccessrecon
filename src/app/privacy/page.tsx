import { InfoPage } from "@/components/InfoPage";

export default function PrivacyPage() {
  return (
    <InfoPage eyebrow="MemberAccessRecon" title="Privacy Policy">
      <p>
        MemberAccessRecon is a read-only evidence app for HighLevel membership, course-access, contact, subscription,
        transaction, and product records. The app requests only read scopes needed to produce access reconciliation
        reports.
      </p>
      <p>
        MemberAccessRecon stores OAuth access and refresh tokens so installed accounts can generate reports. In
        production, stored tokens are encrypted before being persisted. The app does not sell customer data and does not
        use account, payment, or membership data for advertising.
      </p>
      <p>
        Evidence packs may include agency names, contact names and emails, offer or product names, subscription/payment
        status, access status, unlock criteria, findings, CSV roster evidence, and generated content hashes.
        MemberAccessRecon does not create, edit, delete, revoke, tag, or change contacts, payments, courses,
        memberships, offers, or HighLevel account settings.
      </p>
      <p>Support and deletion requests: support@konverter-pro.de.</p>
    </InfoPage>
  );
}
