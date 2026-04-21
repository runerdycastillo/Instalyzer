import type { ReactNode } from "react";

type LegalSection = {
  id: string;
  title: string;
  body: ReactNode;
  className?: string;
};

const legalSections: readonly LegalSection[] = [
  {
    id: "eligibility",
    title: "Eligibility",
    body: (
      <p>
        You must be at least 18 years old to use Instalyzer. By using the
        platform, you confirm that you are legally allowed to access and upload
        the data you provide.
      </p>
    ),
  },
  {
    id: "using-the-product",
    title: "Using the product",
    body: (
      <p>
        You may use Instalyzer only with exports, account information, and
        content you own or are authorized to access. You may not use the service
        in ways that violate laws, abuse the platform, interfere with other
        users, or attempt to gain unauthorized access.
      </p>
    ),
  },
  {
    id: "acceptable-use",
    title: "Acceptable use",
    className: "terms-page__card--tall",
    body: (
      <>
        <p>You agree not to:</p>
        <ul className="privacy-policy-page__list">
          <li>Upload data you do not own or have permission to use</li>
          <li>Reverse engineer, scrape, exploit, or overload the service</li>
          <li>Use Instalyzer for spam, harassment, fraud, or illegal activity</li>
          <li>Share accounts in a way that bypasses plan limits</li>
          <li>Attempt to interfere with platform security or infrastructure</li>
        </ul>
      </>
    ),
  },
  {
    id: "accounts-and-access",
    title: "Accounts and access",
    body: (
      <p>
        You are responsible for maintaining the security of any account
        credentials you create or use with Instalyzer. Instalyzer may suspend or
        terminate accounts that violate these terms, create security risks, or
        misuse the service.
      </p>
    ),
  },
  {
    id: "uploaded-data",
    title: "Uploaded data",
    body: (
      <p>
        You retain ownership of the Instagram exports, files, and content you
        upload. By uploading data, you grant Instalyzer permission to process,
        analyze, and store that data as necessary to provide the service.
      </p>
    ),
  },
  {
    id: "ai-and-analytics-disclaimer",
    title: "AI and analytics disclaimer",
    className: "terms-page__card--tall",
    body: (
      <p>
        Instalyzer provides AI-generated insights, recommendations, and
        analytics for informational purposes only. Results may not always be
        accurate, complete, or guaranteed. You should not rely solely on
        Instalyzer for business, legal, financial, or marketing decisions.
      </p>
    ),
  },
  {
    id: "soft-launch-availability",
    title: "Soft-launch availability",
    body: (
      <p>
        Instalyzer is actively being developed. Features, outputs, availability,
        and workspace behavior may change over time as the product expands.
        Authentication and paid tiers may be introduced later.
      </p>
    ),
  },
  {
    id: "intellectual-property",
    title: "Intellectual property",
    body: (
      <p>
        All Instalyzer branding, designs, software, UI, logos, and platform
        features remain the property of Instalyzer. You may not copy, reproduce,
        resell, or distribute any part of the service without permission.
      </p>
    ),
  },
  {
    id: "termination",
    title: "Termination",
    body: (
      <p>
        Instalyzer may suspend or terminate your access if you violate these
        terms, misuse the platform, create security risks, or attempt
        unauthorized access to the service.
      </p>
    ),
  },
  {
    id: "limitation-of-liability",
    title: "Limitation of liability",
    body: (
      <p>
        Instalyzer is provided &quot;as is&quot; without warranties of any kind.
        Instalyzer is not responsible for lost profits, lost business
        opportunities, lost data, or indirect damages resulting from use of the
        service.
      </p>
    ),
  },
  {
    id: "changes-to-terms",
    title: "Changes to terms",
    body: (
      <p>
        These terms may be updated from time to time. Continued use of
        Instalyzer after changes become effective means you agree to the updated
        terms.
      </p>
    ),
  },
] as const;

const sideCards = [
  {
    id: "support",
    title: "Support",
    body: (
      <>
        <p>Questions about these terms can be sent to:</p>
        <a
          href="mailto:support@instalyzer.app"
          className="privacy-policy-page__email"
        >
          support@instalyzer.app
        </a>
        <div className="terms-page__support-actions">
          <a href="mailto:support@instalyzer.app" className="hero-btn hero-btn-secondary">
            Contact support
          </a>
        </div>
      </>
    ),
  },
  {
    id: "future-billing",
    title: "Future billing",
    body: (
      <p>
        If paid plans are introduced after the soft launch, pricing, renewal
        terms, cancellation rules, and any refund details will be presented
        clearly before purchase.
      </p>
    ),
  },
  {
    id: "governing-law",
    title: "Governing law",
    body: (
      <p>
        These terms are governed by the laws of the Commonwealth of
        Massachusetts.
      </p>
    ),
  },
  {
    id: "last-updated",
    title: "Last updated",
    body: <p>April 2026</p>,
  },
] as const;

export default function TermsPage() {
  return (
    <main className="privacy-policy-page terms-page">
      <section className="privacy-policy-page__hero">
        <p className="section-kicker">terms</p>
        <h1 className="privacy-policy-page__title">Terms of Service</h1>
        <p className="privacy-policy-page__description">
          These terms govern access to Instalyzer during the current soft
          launch.
        </p>
        <p className="terms-page__updated-label">Last updated: April 2026</p>
        <p className="terms-page__helper">
          By using Instalyzer, you agree to these terms.
        </p>
      </section>

      <div className="privacy-policy-page__grid">
        <div className="privacy-policy-page__content terms-page__content">
          {legalSections.map((section) => (
            <article
              key={section.id}
              id={section.id}
              className={`privacy-policy-page__card${section.className ? ` ${section.className}` : ""}`}
            >
              <h2 className="privacy-policy-page__card-title">{section.title}</h2>
              <div className="privacy-policy-page__card-copy">{section.body}</div>
            </article>
          ))}
        </div>

        <aside className="terms-page__aside">
          <div className="terms-page__aside-stack">
            {sideCards.map((card) => (
              <article key={card.id} className="privacy-policy-page__card">
                <h2 className="privacy-policy-page__card-title">{card.title}</h2>
                <div className="privacy-policy-page__card-copy">{card.body}</div>
              </article>
            ))}
          </div>
        </aside>
      </div>
    </main>
  );
}
