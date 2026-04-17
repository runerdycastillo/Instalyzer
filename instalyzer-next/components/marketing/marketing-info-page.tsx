import Link from "next/link";
import type { ReactNode } from "react";

type MarketingInfoPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  sections: Array<{
    title: string;
    body: ReactNode;
  }>;
  asideTitle: string;
  asideBody: ReactNode;
  actions?: Array<{
    href: string;
    label: string;
    external?: boolean;
  }>;
};

export function MarketingInfoPage({
  eyebrow,
  title,
  description,
  sections,
  asideTitle,
  asideBody,
  actions = [],
}: MarketingInfoPageProps) {
  return (
    <main className="marketing-info-page">
      <section className="marketing-info-page__hero">
        <p className="section-kicker">{eyebrow}</p>
        <h1 className="marketing-info-page__title">{title}</h1>
        <p className="marketing-info-page__description">{description}</p>
      </section>

      <div className="marketing-info-page__grid">
        <div className="marketing-info-page__stack">
          {sections.map((section) => (
            <article key={section.title} className="marketing-info-page__card">
              <h2 className="marketing-info-page__card-title">{section.title}</h2>
              <div className="marketing-info-page__card-copy">{section.body}</div>
            </article>
          ))}
        </div>

        <aside className="marketing-info-page__aside">
          <span className="marketing-info-page__aside-label">{asideTitle}</span>
          <div className="marketing-info-page__aside-copy">{asideBody}</div>

          {actions.length ? (
            <div className="marketing-info-page__actions">
              {actions.map((action) =>
                action.external ? (
                  <a key={action.href} href={action.href} className="hero-btn hero-btn-secondary">
                    {action.label}
                  </a>
                ) : (
                  <Link key={action.href} href={action.href} className="hero-btn hero-btn-secondary">
                    {action.label}
                  </Link>
                ),
              )}
            </div>
          ) : null}
        </aside>
      </div>
    </main>
  );
}
