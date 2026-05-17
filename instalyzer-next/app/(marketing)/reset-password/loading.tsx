import { KeyRound, LockKeyhole, ShieldCheck } from "lucide-react";

const resetPasswordLoadingCards = [
  { title: "password", Icon: LockKeyhole },
  { title: "privacy", Icon: ShieldCheck },
  { title: "access", Icon: KeyRound },
] as const;

export default function ResetPasswordLoading() {
  return (
    <section
      className="account-route reset-password-route reset-password-route--loading"
      aria-busy="true"
      aria-labelledby="reset-password-loading-title"
    >
      <div className="account-route__hero reset-password-route__hero">
        <div className="account-route__hero-copy reset-password-route__copy">
          <p className="account-route__eyebrow">workspace access</p>
          <h1 id="reset-password-loading-title">choose a new password</h1>
          <div className="sign-up-loading__copy-lines" aria-hidden="true">
            <span className="dataset-skeleton-line sign-up-loading__line sign-up-loading__line--wide" />
            <span className="dataset-skeleton-line sign-up-loading__line" />
          </div>
        </div>

        <aside
          className="account-route__summary account-route__returning reset-password-route__form reset-password-route__form--loading"
          aria-label="loading reset password form"
        >
          <p className="account-route__eyebrow">reset password</p>
          <h2>new password</h2>

          <div className="sign-up-loading__form" aria-hidden="true">
            {["new password", "confirm password"].map((field) => (
              <div className="sign-up-loading__field" key={field}>
                <span className="dataset-skeleton-line sign-up-loading__label" />
                <span className="dataset-skeleton-line sign-up-loading__input" />
              </div>
            ))}
            <span className="dataset-skeleton-line sign-up-loading__button" />
          </div>

          <p className="auth-panel__switch reset-password-form__switch">
            remember your password? <span>sign in</span>
          </p>
        </aside>
      </div>

      <div className="account-route__grid reset-password-route__grid" aria-hidden="true">
        {resetPasswordLoadingCards.map((card) => (
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
