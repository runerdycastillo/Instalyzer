import { KeyRound, MailCheck, ShieldCheck } from "lucide-react";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

const resetCards = [
  {
    title: "check your inbox",
    body: "firebase sends the reset link directly to your email.",
    icon: MailCheck,
  },
  {
    title: "keep access private",
    body: "your workspace access stays tied to your account.",
    icon: ShieldCheck,
  },
  {
    title: "return when ready",
    body: "sign in again after choosing a new password.",
    icon: KeyRound,
  },
];

export default function ForgotPasswordPage() {
  return (
    <section className="account-route forgot-password-route" aria-labelledby="forgot-password-route-title">
      <div className="account-route__hero forgot-password-route__hero">
        <div className="account-route__hero-copy forgot-password-route__copy">
          <p className="account-route__eyebrow">workspace access</p>
          <h1 id="forgot-password-route-title">reset your password</h1>
          <p>enter your account email and we&apos;ll send a secure reset link.</p>
        </div>

        <aside
          className="account-route__summary account-route__returning forgot-password-route__form"
          aria-label="reset password"
        >
          <p className="account-route__eyebrow">forgot password</p>
          <h2>get back in</h2>
          <ForgotPasswordForm />
        </aside>
      </div>

      <div className="account-route__grid forgot-password-route__grid">
        {resetCards.map((card) => (
          <article className="account-card" key={card.title}>
            <div className="account-card__head">
              <span className="account-card__icon" aria-hidden="true">
                <card.icon strokeWidth={1.9} />
              </span>
              <h2>{card.title}</h2>
            </div>
            <p>{card.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
