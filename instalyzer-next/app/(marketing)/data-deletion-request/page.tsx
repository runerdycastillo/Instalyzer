const deletionSections = [
  {
    id: "current-soft-launch-model",
    title: "Current soft-launch model",
    body: (
      <>
        <p>
          During the current soft launch, Instalyzer primarily stores uploaded
          dataset information locally in your browser on your device.
        </p>
        <p>This means most deletion requests are handled by you directly.</p>
      </>
    ),
  },
  {
    id: "delete-browser-stored-data",
    title: "Delete browser-stored data",
    body: (
      <>
        <p>You can remove local Instalyzer workspace data by:</p>
        <ul className="privacy-policy-page__list">
          <li>deleting saved datasets inside the workspace</li>
          <li>clearing browser storage for Instalyzer</li>
          <li>removing browser-stored preferences and saved selections</li>
          <li>removing cached uploads and generated analytics data</li>
        </ul>
        <p>
          Because current workspace data is device-based, deleting it in your
          browser removes it from that device.
        </p>
      </>
    ),
  },
  {
    id: "support-and-contact-data",
    title: "Support and contact data",
    body: (
      <>
        <p>
          If you previously sent support emails, product feedback, or contact
          submissions and want that information deleted, email{" "}
          <a href="mailto:support@instalyzer.app">support@instalyzer.app</a>{" "}
          with your request.
        </p>
        <p>
          Deletion requests may require identity verification to protect user
          privacy and prevent unauthorized requests.
        </p>
      </>
    ),
  },
  {
    id: "what-to-include",
    title: "What to include in your request",
    body: (
      <>
        <p>To help process a deletion request, include:</p>
        <ul className="privacy-policy-page__list">
          <li>the email address you used to contact Instalyzer</li>
          <li>the type of information you want deleted</li>
          <li>any useful context that helps identify the request</li>
        </ul>
      </>
    ),
  },
  {
    id: "future-account-deletion",
    title: "Future account deletion",
    body: (
      <>
        <p>
          If cloud syncing, accounts, or paid plans are introduced later,
          Instalyzer will expand this page with a fuller account and platform
          data deletion process.
        </p>
        <p>
          Future versions of Instalyzer may include in-app account deletion
          tools and automatic deletion workflows.
        </p>
      </>
    ),
  },
  {
    id: "third-party-services",
    title: "Third-party services",
    body: (
      <p>
        If Instalyzer later integrates with third-party services such as payment
        providers, authentication systems, analytics tools, or cloud storage,
        users may also need to manage or delete information directly through
        those services.
      </p>
    ),
  },
] as const;

export default function DataDeletionRequestPage() {
  return (
    <main className="privacy-policy-page">
      <section className="privacy-policy-page__hero">
        <p className="section-kicker">data deletion</p>
        <h1 className="privacy-policy-page__title">Data Deletion Request</h1>
        <p className="privacy-policy-page__description">
          This page explains how to delete browser-stored Instalyzer data and
          how to request removal of submitted support or contact information.
        </p>
        <p className="privacy-policy-page__updated">Last updated: April 2026</p>
      </section>

      <div className="privacy-policy-page__grid">
        <div className="privacy-policy-page__content">
          {deletionSections.map((section) => (
            <article
              key={section.id}
              id={section.id}
              className="privacy-policy-page__card"
            >
              <h2 className="privacy-policy-page__card-title">{section.title}</h2>
              <div className="privacy-policy-page__card-copy">{section.body}</div>
            </article>
          ))}
        </div>

        <aside className="privacy-policy-page__aside">
          <div className="privacy-policy-page__aside-block">
            <span className="privacy-policy-page__aside-label">Deletion requests</span>
            <a
              href="mailto:support@instalyzer.app"
              className="privacy-policy-page__email"
            >
              support@instalyzer.app
            </a>
            <p className="privacy-policy-page__aside-copy">
              We aim to respond to deletion requests within 7 business days.
            </p>
          </div>

          <div className="privacy-policy-page__aside-block">
            <span className="privacy-policy-page__aside-label">Quick links</span>
            <nav className="privacy-policy-page__nav" aria-label="Data deletion sections">
              {deletionSections.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className="privacy-policy-page__nav-link"
                >
                  {section.title}
                </a>
              ))}
            </nav>
          </div>

          <div className="privacy-policy-page__aside-block">
            <span className="privacy-policy-page__aside-label">Current status</span>
            <p className="privacy-policy-page__aside-copy">
              Most saved workspace data remains local to your browser during the
              soft launch.
            </p>
            <p className="privacy-policy-page__aside-copy">
              Cloud account storage is not currently enabled.
            </p>
          </div>

          <div className="privacy-policy-page__aside-block">
            <span className="privacy-policy-page__aside-label">Last updated</span>
            <p className="privacy-policy-page__aside-copy">April 2026</p>
          </div>

          <div className="privacy-policy-page__trust">
            <span className="privacy-policy-page__trust-badge">
              Local-first soft launch
            </span>
          </div>
        </aside>
      </div>
    </main>
  );
}
