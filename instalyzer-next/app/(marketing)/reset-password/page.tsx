import { KeyRound, LockKeyhole, ShieldCheck } from "lucide-react";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

const resetPasswordCards = [
  {
    title: "choose a new password",
    body: "use the secure link from your email to update access.",
    icon: LockKeyhole,
  },
  {
    title: "protect your workspace",
    body: "your instagram export workspace stays connected to your account.",
    icon: ShieldCheck,
  },
  {
    title: "return when done",
    body: "sign in again after the password is updated.",
    icon: KeyRound,
  },
];

export default function ResetPasswordPage() {
  return (
    <section className="account-route reset-password-route" aria-labelledby="reset-password-route-title">
      <div className="account-route__hero reset-password-route__hero">
        <div className="account-route__hero-copy reset-password-route__copy">
          <p className="account-route__eyebrow">workspace access</p>
          <h1 id="reset-password-route-title">choose a new password</h1>
          <p>set a new password and get back into your Instalyzer workspace.</p>
        </div>

        <aside
          className="account-route__summary account-route__returning reset-password-route__form"
          aria-label="reset password"
        >
          <p className="account-route__eyebrow">reset password</p>
          <h2>new password</h2>
          <ResetPasswordForm />
        </aside>
      </div>

      <div className="account-route__grid reset-password-route__grid">
        {resetPasswordCards.map((card) => (
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
