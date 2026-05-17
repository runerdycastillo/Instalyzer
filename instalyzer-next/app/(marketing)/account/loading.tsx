import { FileCheck2, LayoutDashboard, ShieldCheck } from "lucide-react";

const accountLoadingCards = [
  { title: "workspace", Icon: LayoutDashboard },
  { title: "account", Icon: ShieldCheck },
  { title: "data control", Icon: FileCheck2 },
] as const;

export default function AccountLoading() {
  return (
    <section
      className="account-route account-route--loading"
      aria-busy="true"
      aria-labelledby="account-loading-title"
    >
      <div className="account-route__hero">
        <div className="account-route__hero-copy">
          <p className="account-route__eyebrow">personal workspace</p>
          <h1 id="account-loading-title">loading your account</h1>
          <div className="account-loading__copy-lines" aria-hidden="true">
            <span className="dataset-skeleton-line account-loading__line account-loading__line--wide" />
            <span className="dataset-skeleton-line account-loading__line" />
          </div>
        </div>

        <aside className="account-route__summary account-route__summary--loading" aria-label="loading workspace status">
          <h2>workspace status</h2>
          <ul aria-hidden="true">
            {["status", "identity"].map((item) => (
              <li key={item}>
                <span className="dataset-skeleton-line account-loading__summary-title" />
                <span className="dataset-skeleton-line account-loading__summary-line" />
              </li>
            ))}
          </ul>
        </aside>
      </div>

      <div className="account-route__grid" aria-hidden="true">
        {accountLoadingCards.map((card) => (
          <article className="account-card account-card--loading" key={card.title}>
            <div className="account-card__head">
              <span className="account-card__icon" aria-hidden="true">
                <card.Icon strokeWidth={1.9} />
              </span>
              <h2>{card.title}</h2>
            </div>
            <span className="dataset-skeleton-line account-loading__card-line account-loading__card-line--wide" />
            <span className="dataset-skeleton-line account-loading__card-line" />
          </article>
        ))}
      </div>
    </section>
  );
}
