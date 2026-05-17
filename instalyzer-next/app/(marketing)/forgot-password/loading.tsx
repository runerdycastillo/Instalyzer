import { KeyRound, MailCheck, ShieldCheck } from "lucide-react";

const forgotPasswordLoadingCards = [
  { title: "inbox", Icon: MailCheck },
  { title: "privacy", Icon: ShieldCheck },
  { title: "access", Icon: KeyRound },
] as const;

export default function ForgotPasswordLoading() {
  return (
    <section
      className="account-route forgot-password-route forgot-password-route--loading"
      aria-busy="true"
      aria-labelledby="forgot-password-loading-title"
    >
      <div className="account-route__hero forgot-password-route__hero">
        <div className="account-route__hero-copy forgot-password-route__copy">
          <p className="account-route__eyebrow">workspace access</p>
          <h1 id="forgot-password-loading-title">reset your password</h1>
          <div className="sign-in-loading__copy-lines" aria-hidden="true">
            <span className="dataset-skeleton-line sign-in-loading__line sign-in-loading__line--wide" />
            <span className="dataset-skeleton-line sign-in-loading__line" />
          </div>
        </div>

        <aside
          className="account-route__summary account-route__returning forgot-password-route__form forgot-password-route__form--loading"
          aria-label="loading forgot password form"
        >
          <p className="account-route__eyebrow">forgot password</p>
          <h2>get back in</h2>

          <div className="sign-in-loading__form" aria-hidden="true">
            <div className="sign-in-loading__field">
              <span className="dataset-skeleton-line sign-in-loading__label" />
              <span className="dataset-skeleton-line sign-in-loading__input" />
            </div>
            <span className="dataset-skeleton-line sign-in-loading__button" />
          </div>

          <p className="auth-panel__switch forgot-password-form__switch">
            know your password? <span>sign in</span>
          </p>
        </aside>
      </div>

      <div className="account-route__grid forgot-password-route__grid" aria-hidden="true">
        {forgotPasswordLoadingCards.map((card) => (
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
