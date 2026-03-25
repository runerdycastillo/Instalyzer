import Link from "next/link";

type RoutePlaceholderProps = {
  route: string;
  label: string;
  description: string;
  family: "marketing" | "workspace";
  nextSteps: string[];
  links?: Array<{
    href: string;
    label: string;
  }>;
};

export function RoutePlaceholder({
  route,
  label,
  description,
  family,
  nextSteps,
  links = [],
}: RoutePlaceholderProps) {
  return (
    <section className="route-placeholder">
      <div className="route-placeholder__hero">
        <span className={`route-badge route-badge--${family}`}>{family} route</span>
        <p className="route-path">{route}</p>
        <h1>{label}</h1>
        <p className="route-description">{description}</p>
      </div>

      <div className="route-grid">
        <article className="route-card">
          <h2>Day 1 status</h2>
          <p>
            This page is intentionally a placeholder so we can verify the route map and
            layout split before porting real product UI.
          </p>
        </article>

        <article className="route-card">
          <h2>Next build steps</h2>
          <ul className="route-list">
            {nextSteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ul>
        </article>
      </div>

      {links.length ? (
        <div className="route-links">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="route-link">
              {link.label}
            </Link>
          ))}
        </div>
      ) : null}
    </section>
  );
}
