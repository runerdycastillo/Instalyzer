import { Fragment } from "react";
import {
  ArrowUpRight,
  ChartColumnBig,
  Upload,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { FaqAccordion } from "@/components/marketing/faq-accordion";
import { HeroScrollLink } from "@/components/marketing/hero-scroll-link";
import { MarketingScrollReveal } from "@/components/marketing/marketing-scroll-reveal";
import { homeShowcaseTools, resultsPreviewPills } from "@/lib/instagram/tool-catalog";

const SHOW_PRICING_SECTION = false;

const howItWorksSteps = [
  {
    step: "step 1",
    title: "upload your export",
    copy: "download the official instagram export zip and bring it into instalyzer.",
    icon: Upload,
  },
  {
    step: "step 2",
    title: "create a reusable dataset",
    copy: "we check the export and turn it into a dataset you can come back to inside the workspace.",
    icon: ChartColumnBig,
  },
  {
    step: "step 3",
    title: "run the first live tool",
    copy: "start with not following back now while the same dataset stays ready for the next tools.",
    icon: ArrowUpRight,
  },
] as const;

const resultsPreviewMetrics = [
  { label: "followers", value: 2184 },
  { label: "accounts reached", value: 12430 },
  { label: "profile visits", value: 1287 },
  { label: "content interactions", value: 436 },
  { label: "impressions", value: 48920 },
  { label: "accounts engaged", value: 823 },
] as const;

const pricingPlans: ReadonlyArray<{
  cardClassName: string;
  tier: string;
  price: string;
  billingLabel: string | null;
  copy: string;
  features: readonly string[];
  ctaLabel: string;
  ctaClassName: string;
  badge: string | null;
  featured?: boolean;
}> = [
  {
    cardClassName: "pricing-card-free",
    tier: "free",
    price: "$0",
    billingLabel: null,
    copy:
      "start with the core relationship workflow and preview what your export can unlock.",
    features: ["not following back", "export overview", "visibility snapshot"],
    ctaLabel: "start free",
    ctaClassName: "",
    badge: null,
  },
  {
    cardClassName: "pricing-card-basic",
    tier: "basic",
    price: "$3.99",
    billingLabel: "/ month",
    copy:
      "unlock the most useful creator tools in one lightweight monthly plan.",
    features: ["ghost followers", "activity insights", "audience insights"],
    ctaLabel: "upgrade to basic",
    ctaClassName: "pricing-card-btn-featured",
    badge: "most popular",
    featured: true,
  },
  {
    cardClassName: "pricing-card-premium",
    tier: "premium",
    price: "$7.99",
    billingLabel: "/ month",
    copy:
      "go deeper with premium summary tools and the most polished reporting layer.",
    features: ["growth summary", "visibility summary", "engagement summary"],
    ctaLabel: "unlock premium",
    ctaClassName: "pricing-card-btn-premium",
    badge: null,
  },
] as const;

const faqColumns = [
  [
    {
      question: "how do i download my data?",
      answer:
        "use instagram's download-your-information flow, then upload the official zip here. the help page walks through the settings step by step.",
      startsOpen: true,
    },
    {
      question: "is my data stored on your servers?",
      answer:
        "the current launch flow keeps your saved dataset in your browser on this device. you do not need to log into instagram through instalyzer.",
    },
    {
      question: "what happens after i upload?",
      answer:
        "instalyzer checks the export, lets you create a reusable dataset, and opens the workspace with not following back ready to use now.",
    },
  ],
  [
    {
      question: "do i need to log into instagram?",
      answer:
        "no. you never log into instagram through our platform. we only use the export file you provide.",
    },
    {
      question: "what file format is supported?",
      answer:
        "use the official instagram export as a zip with json data. for relationship tools like not following back, all time is the recommended export range.",
    },
    {
      question: "is this free right now?",
      answer:
        "yes. the current soft launch is free while the workspace expands beyond the first live tool.",
    },
  ],
] as const;

export function MarketingHomeRoute() {
  return (
    <main className="landing-shell" aria-label="Home landing page">
      <MarketingScrollReveal />

      <section className="hero-section" aria-labelledby="hero-title">
        <div className="hero-content">
          <p className="hero-eyebrow">instagram export workspace</p>

          <h1 id="hero-title" className="hero-title">
            <span className="hero-title-line">unlock powerful tools</span>
            <span className="hero-title-line">from your instagram export</span>
          </h1>

          <p className="hero-copy">
            instalyzer turns your instagram export into a reusable workspace so you
            have access to your tools in one place.
          </p>

          <div className="hero-actions">
            <Link href="/app/datasets/new?entry=home-hero" className="hero-btn hero-btn-primary">
              get started
            </Link>

            <a href="#how-it-works" className="hero-btn hero-btn-secondary">
              how it works
            </a>
          </div>
        </div>

        <HeroScrollLink
          targetId="tools-section"
          centeredSelector=".section-scroll-target"
          className="hero-scroll-cue"
          ariaLabel="Scroll to tools section"
        >
          <span className="hero-scroll-mouse" aria-hidden="true">
            <span className="hero-scroll-wheel" />
          </span>
          <span className="hero-scroll-text">scroll to explore</span>
        </HeroScrollLink>
      </section>

      <section
        id="tools-section"
        className="landing-tools-section"
        aria-labelledby="tools-section-title"
        data-reveal
      >
        <div id="tools-scroll-target" className="section-scroll-target">
          <div className="section-intro tools-section-intro">
            <p className="section-kicker">dataset tools</p>
            <h2 id="tools-section-title" className="section-title">
              one export can unlock more than one workflow
            </h2>
            <p className="section-copy">
              the soft launch starts with not following back live now. the same
              dataset foundation is built to support audience, reach, and content
              analysis next.
            </p>
          </div>

          <div className="tools-showcase-grid" aria-label="Instalyzer tools">
            {homeShowcaseTools.map((tool) => (
              <article
                key={tool.title}
                className={`tools-showcase-card${tool.featured ? " is-featured" : ""}`}
              >
                <div className="tools-showcase-card__head">
                  <span className="tools-showcase-icon" aria-hidden="true">
                    <tool.icon aria-hidden="true" strokeWidth={1.9} />
                  </span>
                  <span
                    className={`tools-showcase-badge${
                      tool.availability === "available now" ? " is-live" : ""
                    }`}
                  >
                    {tool.availability}
                  </span>
                </div>

                <div className="tools-showcase-card__body">
                  <h3 className="tools-showcase-title">{tool.title}</h3>
                  <p className="tools-showcase-copy">{tool.homeCopy}</p>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="tier-columns-meta">
          <p className="tier-columns-note">
            <span>start free with the first live tool.</span>
          </p>
          <Link href="/app/datasets/new?entry=home-hero" className="hero-btn hero-btn-primary">
            open the workspace
          </Link>
        </div>
      </section>

      <section
        id="how-it-works"
        className="how-it-works-section"
        aria-labelledby="how-it-works-title"
        data-reveal
      >
        <div className="section-intro how-it-works-intro">
          <p className="section-kicker">how it works</p>
          <h2 id="how-it-works-title" className="section-title">
            turn your instagram export into insights
          </h2>
          <p className="section-copy">
            upload your export, analyze your network, and explore the insights.
          </p>
        </div>

        <div className="how-it-works-grid" aria-label="How Instalyzer works">
          {howItWorksSteps.map((step, index) => (
            <Fragment key={step.step}>
              <article className="how-it-works-card">
                <span className="how-it-works-step">{step.step}</span>
                <span className="how-it-works-icon" aria-hidden="true">
                  <step.icon aria-hidden="true" strokeWidth={1.9} />
                </span>
                <h3 className="how-it-works-card-title">{step.title}</h3>
                <p className="how-it-works-card-copy">{step.copy}</p>
              </article>

              {index < howItWorksSteps.length - 1 ? (
                <span className="how-it-works-chevron" aria-hidden="true" />
              ) : null}
            </Fragment>
          ))}
        </div>

        <div className="how-it-works-help">
          <p className="how-it-works-help-copy">need help exporting your data?</p>
          <Link href="/help" className="how-it-works-help-link">
            how to download your instagram data
          </Link>
        </div>
      </section>

      <section
        className="results-preview-section"
        aria-labelledby="results-preview-title"
        data-reveal
      >
        <div className="section-intro results-preview-intro">
          <p className="section-kicker">results preview</p>
          <h2 id="results-preview-title" className="section-title">
            the dashboard behind your export
          </h2>
          <p className="section-copy">
            start with a dataset and see how the workspace can grow into more tools
            over time.
          </p>
        </div>

        <div className="results-preview-stage" aria-hidden="true">
          <div className="results-preview-shell">
            <article className="results-preview-panel">
              <p className="results-preview-label">account overview</p>

              <div className="results-preview-profile">
                <div className="results-preview-avatar" aria-hidden="true">
                  <UserRound aria-hidden="true" strokeWidth={1.9} />
                </div>

                <div className="results-preview-profile-copy">
                  <span className="results-preview-profile-handle">@username</span>
                  <strong>dataset overview</strong>
                  <span>latest import</span>
                </div>
              </div>

              <div className="results-preview-metrics">
                {resultsPreviewMetrics.map((metric) => (
                  <article key={metric.label} className="results-preview-metric">
                    <span>{metric.label}</span>
                    <strong data-countup-target={metric.value}>
                      {metric.value.toLocaleString()}
                    </strong>
                  </article>
                ))}
              </div>
            </article>

            <aside className="results-preview-side">
              <p className="results-preview-side-kicker">tools unlocked</p>

              <div className="results-preview-pill-stack">
                {resultsPreviewPills.map((pill) => (
                  <span
                    key={pill.label}
                    className={`results-preview-pill ${pill.className}`}
                  >
                    {pill.label}
                  </span>
                ))}
              </div>
            </aside>
          </div>
        </div>

        <div className="results-preview-cta">
          <p className="results-preview-cta-copy">
            ready to unlock your instagram insights?
          </p>
          <Link
            href="/app/datasets/new?entry=home-results-preview"
            className="results-preview-cta-link"
          >
            instalyze your export
          </Link>
        </div>
      </section>

      {SHOW_PRICING_SECTION ? (
        <section
          id="pricing-section"
          className="pricing-section"
          aria-labelledby="pricing-title"
          data-reveal
        >
          <div id="pricing-scroll-target" className="section-scroll-target">
            <div className="section-intro pricing-intro">
              <p className="section-kicker">pricing</p>
              <h2 id="pricing-title" className="section-title">
                pick the right plan for your workflow
              </h2>
              <p className="section-copy">
                start free, unlock more tools as you grow, and upgrade when you want
                deeper insights.
              </p>
            </div>

            <div className="pricing-grid" aria-label="Pricing plans">
              {pricingPlans.map((plan) => (
                <article
                  key={plan.tier}
                  className={`pricing-card ${plan.cardClassName}${plan.featured ? " is-featured" : ""}`}
                >
                  {plan.badge ? <div className="pricing-card-badge">{plan.badge}</div> : null}

                  <div className="pricing-card-head">
                    <p className="pricing-card-tier">{plan.tier}</p>
                    <p className="pricing-card-price">
                      <span>{plan.price}</span>
                      {plan.billingLabel ? <small>{plan.billingLabel}</small> : null}
                    </p>
                  </div>

                  <p className="pricing-card-copy">{plan.copy}</p>

                  <ul className="pricing-feature-list">
                    {plan.features.map((feature) => (
                      <li key={feature}>{feature}</li>
                    ))}
                  </ul>

                  <Link
                    href={`/app/datasets/new?entry=${`home-pricing-${plan.tier}`}`}
                    className={`pricing-card-btn ${plan.ctaClassName}`.trim()}
                  >
                    {plan.ctaLabel}
                  </Link>
                </article>
              ))}
            </div>
          </div>

          <div className="pricing-footer">
            <p className="pricing-reassurance">
              cancel anytime. no instagram login required. your export stays private.
            </p>

            <div className="pricing-footer-cta">
              <p className="pricing-footer-copy">need help choosing a plan?</p>
              <HeroScrollLink
                targetId="tools-section"
                centeredSelector=".section-scroll-target"
                className="pricing-footer-link"
                ariaLabel="Scroll to tools section"
              >
                compare tools
              </HeroScrollLink>
            </div>
          </div>
        </section>
      ) : null}

      <section className="faq-section" aria-labelledby="faq-title" data-reveal>
        <div className="section-intro faq-intro">
          <p className="section-kicker">faq</p>
          <h2 id="faq-title" className="section-title">
            common questions before you upload
          </h2>
          <p className="section-copy">
            the basics on export setup, privacy, and what the current soft launch
            already supports.
          </p>
        </div>

        <FaqAccordion columns={faqColumns} />

        <div className="faq-footer">
          <p className="faq-footer-copy">still have questions?</p>
          <a href="#" className="faq-footer-link">
            contact support
          </a>
        </div>
      </section>

      <section
        className="final-cta-section"
        aria-labelledby="final-cta-title"
        data-reveal
      >
        <div className="section-intro final-cta-intro">
          <p className="section-kicker">final step</p>
          <h2 id="final-cta-title" className="section-title">
            ready to analyze your instagram data?
          </h2>
          <p className="section-copy">
            upload your export and try the first live tool now. no instagram login
            required and your data stays private.
          </p>
        </div>

        <div className="final-cta-placeholder">
          <Link
            href="/app/datasets/new?entry=home-final-cta"
            className="final-cta-placeholder-btn"
          >
            instalyze your export
          </Link>
          <p
            className="final-cta-placeholder-trust"
            aria-label="no instagram login required, free launch, your data stays private"
          >
            <span>no instagram login required</span>
            <span>free launch</span>
            <span>your data stays private</span>
          </p>
        </div>
      </section>
    </main>
  );
}

