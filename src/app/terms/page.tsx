import { InfoPage } from "@/components/InfoPage";

export default function TermsPage() {
  return (
    <InfoPage eyebrow="MemberAccessRecon" title="Terms of Service">
      <p>
        MemberAccessRecon provides read-only membership access, payment, subscription, and roster evidence packs for
        operational reconciliation. It is not legal, tax, or accounting advice and does not guarantee that every
        historical access state is available through HighLevel APIs.
      </p>
      <p>
        Findings are based on available HighLevel contact, payment, subscription, product, course/access roster, and CSV
        evidence at the time a pack is generated. Users should review all evidence before relying on it in a client
        membership audit.
      </p>
      <p>
        MemberAccessRecon does not modify account data. Users remain responsible for revoking access, restoring access,
        updating tags, contacting members, and validating exports against their systems of record.
      </p>
      <p>Support: support@konverter-pro.de.</p>
    </InfoPage>
  );
}
