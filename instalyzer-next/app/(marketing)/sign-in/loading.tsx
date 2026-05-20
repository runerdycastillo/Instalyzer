import { FileCheck2 as ExportIcon, LayoutDashboard, ShieldCheck } from "lucide-react";

const signInLoadingCards = [
  { title: "your export", Icon: ExportIcon },
  { title: "workspace", Icon: LayoutDashboard },
  { title: "control", Icon: ShieldCheck },
] as const;

export default function SignInLoading() {
  return (
    <section
      className="account-route sign-in-route sign-in-route--loading"
      aria-busy="true"
      aria-labelledby="sign-in-loading-title"
    >
      <div className="account-route__hero sign-in-route__hero">
        <div className="account-route__hero-copy sign-in-route__copy">
          <p className="account-route__eyebrow">workspace access</p>
          <h1 id="sign-in-loading-title">return to your workspace</h1>
          <div className="sign-in-loading__copy-lines" aria-hidden="true">
            <span className="dataset-skeleton-line sign-in-loading__line sign-in-loading__line--wide" />
            <span className="dataset-skeleton-line sign-in-loading__line" />
          </div>
        </div>

        <aside
          className="account-route__summary account-route__returning sign-in-route__form sign-in-route__form--loading"
          aria-label="loading sign in form"
        >
          <p className="account-route__eyebrow">sign in</p>
          <h2>welcome back</h2>

          <div className="sign-in-loading__form" aria-hidden="true">
            {["email", "password"].map((field) => (
              <div className="sign-in-loading__field" key={field}>
                <span className="dataset-skeleton-line sign-in-loading__label" />
                <span className="dataset-skeleton-line sign-in-loading__input" />
              </div>
            ))}
            <span className="dataset-skeleton-line sign-in-loading__button" />
            <span className="dataset-skeleton-line sign-in-loading__button sign-in-loading__button--secondary" />
          </div>

          <p className="auth-panel__switch sign-in-route__switch">
            new to Instalyzer? <span>create account</span>
          </p>
        </aside>
      </div>

      <div className="account-route__grid sign-in-route__grid" aria-hidden="true">
        {signInLoadingCards.map((card) => (
          <article className="account-card account-card--loading" key={card.title}>
            <div className="account-card__head">
              <span className="account-card__icon" aria-hidden="true">
                <card.Icon strokeWidth={1.9} />
              </span>
              <h2>{card.title}</h2>
            </div>
            <span className="dataset-skeleton-line account-loading__card-line account-loading__card-line--wide" />
          </article>
        ))}
      </div>
    </section>
  );
}
