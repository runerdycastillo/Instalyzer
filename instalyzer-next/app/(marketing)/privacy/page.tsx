const privacySections = [
  {
    id: "information-we-collect",
    title: "Information We Collect",
    body: (
      <>
        <p>Instalyzer may collect:</p>
        <ul className="privacy-policy-page__list">
          <li>uploaded Instagram export files</li>
          <li>dataset names created inside the workspace</li>
          <li>
            relationship analysis results such as followers, following, mutuals,
            and account status labels
          </li>
          <li>browser-stored preferences and saved datasets</li>
          <li>support messages, feedback, and contact submissions</li>
          <li>basic analytics about product usage, page views, and feature interactions</li>
        </ul>
      </>
    ),
  },
  {
    id: "how-we-use-information",
    title: "How We Use Information",
    body: (
      <>
        <p>We use collected information to:</p>
        <ul className="privacy-policy-page__list">
          <li>parse and analyze uploaded Instagram exports</li>
          <li>generate relationship insights and workspace metrics</li>
          <li>save your current workspace and dataset selections</li>
          <li>improve the product experience and future tools</li>
          <li>respond to support requests and product feedback</li>
          <li>detect abuse, bugs, or misuse of the platform</li>
        </ul>
      </>
    ),
  },
  {
    id: "current-storage-model",
    title: "Current Storage Model",
    body: (
      <>
        <p>
          During the current soft launch, Instalyzer primarily stores uploaded
          dataset information locally in your browser.
        </p>
        <p>This means:</p>
        <ul className="privacy-policy-page__list">
          <li>your saved datasets remain on your device unless cloud syncing is introduced later</li>
          <li>Instalyzer does not require direct Instagram login access</li>
          <li>uploaded exports are only used to generate insights inside the workspace</li>
          <li>clearing browser storage may remove saved datasets and preferences</li>
        </ul>
      </>
    ),
  },
  {
    id: "future-features",
    title: "Future Features",
    body: (
      <>
        <p>As Instalyzer grows, future features may include:</p>
        <ul className="privacy-policy-page__list">
          <li>cloud dataset syncing</li>
          <li>paid subscriptions</li>
          <li>account creation</li>
          <li>team workspaces</li>
          <li>additional analytics and reporting features</li>
        </ul>
        <p>
          If these features are introduced, this Privacy Policy will be updated
          to explain what additional information is collected and how it is used.
        </p>
      </>
    ),
  },
  {
    id: "sharing-of-information",
    title: "Sharing of Information",
    body: (
      <>
        <p>Instalyzer does not sell uploaded export data.</p>
        <p>
          We may only share limited information with trusted service providers
          that help operate the platform, such as:
        </p>
        <ul className="privacy-policy-page__list">
          <li>hosting providers</li>
          <li>analytics providers</li>
          <li>payment processors</li>
          <li>customer support tools</li>
        </ul>
        <p>
          These services only receive the minimum information necessary to
          perform their functions.
        </p>
      </>
    ),
  },
  {
    id: "cookies-and-analytics",
    title: "Cookies and Analytics",
    body: (
      <>
        <p>Instalyzer may use cookies, local storage, and analytics tools to:</p>
        <ul className="privacy-policy-page__list">
          <li>remember workspace settings</li>
          <li>improve product performance</li>
          <li>understand feature usage</li>
          <li>measure traffic and engagement</li>
        </ul>
        <p>
          You can disable cookies through your browser settings, although some
          features may not function correctly.
        </p>
      </>
    ),
  },
  {
    id: "your-control",
    title: "Your Control",
    body: (
      <>
        <p>You can:</p>
        <ul className="privacy-policy-page__list">
          <li>delete saved datasets</li>
          <li>remove browser-stored workspace data</li>
          <li>contact support to request deletion of submitted support information</li>
          <li>stop using the product at any time</li>
        </ul>
      </>
    ),
  },
  {
    id: "contact",
    title: "Contact",
    body: (
      <p>
        If you have questions about this Privacy Policy or data handling
        practices, contact{" "}
        <a href="mailto:support@instalyzer.app">support@instalyzer.app</a>.
      </p>
    ),
  },
] as const;

export default function PrivacyPage() {
  return (
    <main className="privacy-policy-page">
      <section className="privacy-policy-page__hero">
        <p className="section-kicker">privacy</p>
        <h1 className="privacy-policy-page__title">Privacy Policy</h1>
        <p className="privacy-policy-page__description">
          this policy explains how instalyzer handles uploaded exports,
          browser-stored datasets, support requests, and future paid features.
        </p>
        <p className="privacy-policy-page__updated">last updated: april 2026</p>
      </section>

      <div className="privacy-policy-page__grid">
        <div className="privacy-policy-page__content">
          {privacySections.map((section) => (
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
            <span className="privacy-policy-page__aside-label">Questions?</span>
            <a
              href="mailto:support@instalyzer.app"
              className="privacy-policy-page__email"
            >
              support@instalyzer.app
            </a>
          </div>

          <div className="privacy-policy-page__aside-block">
            <span className="privacy-policy-page__aside-label">Quick links</span>
            <nav className="privacy-policy-page__nav" aria-label="Privacy sections">
              {privacySections.map((section) => (
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
            <span className="privacy-policy-page__aside-label">Last updated</span>
            <p className="privacy-policy-page__aside-copy">April 2026</p>
          </div>

          <div className="privacy-policy-page__trust">
            <span className="privacy-policy-page__trust-badge">
              No Instagram login required
            </span>
          </div>
        </aside>
      </div>
    </main>
  );
}
