import { FileCheck2, LayoutDashboard, ShieldCheck } from "lucide-react";

const signUpLoadingCards = [
  { title: "your export", Icon: FileCheck2 },
  { title: "workspace", Icon: LayoutDashboard },
  { title: "control", Icon: ShieldCheck },
] as const;

export default function SignUpLoading() {
  return (
    <section
      className="account-route sign-up-route sign-up-route--loading"
      aria-busy="true"
      aria-labelledby="sign-up-loading-title"
    >
      <div className="account-route__hero sign-up-route__hero">
        <div className="account-route__hero-copy sign-up-route__copy">
          <p className="account-route__eyebrow">private workspace</p>
          <h1 id="sign-up-loading-title">create your private workspace</h1>
          <div className="sign-up-loading__copy-lines" aria-hidden="true">
            <span className="dataset-skeleton-line sign-up-loading__line sign-up-loading__line--wide" />
            <span className="dataset-skeleton-line sign-up-loading__line" />
          </div>
        </div>

        <aside
          className="account-route__summary account-route__returning sign-up-route__form sign-up-route__form--loading"
          aria-label="loading create account form"
        >
          <p className="account-route__eyebrow">create account</p>
          <h2>start here</h2>

          <div className="sign-up-loading__form" aria-hidden="true">
            {["email", "password", "confirm password"].map((field) => (
              <div className="sign-up-loading__field" key={field}>
                <span className="dataset-skeleton-line sign-up-loading__label" />
                <span className="dataset-skeleton-line sign-up-loading__input" />
              </div>
            ))}
            <span className="dataset-skeleton-line sign-up-loading__button" />
          </div>

          <p className="auth-panel__switch sign-up-route__switch">
            have an account? <span>sign in</span>
          </p>
        </aside>
      </div>

      <div className="account-route__grid sign-up-route__grid" aria-hidden="true">
        {signUpLoadingCards.map((card) => (
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
