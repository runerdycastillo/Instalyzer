import Link from "next/link";
import { FileCheck2, LayoutDashboard, ShieldCheck } from "lucide-react";
import { AuthForm } from "@/components/auth/auth-form";

const signInCards = [
  {
    title: "your export stays yours",
    body: "use the data you request from instagram.",
    icon: FileCheck2,
  },
  {
    title: "turn it into a workspace",
    body: "save one export as a dataset you can revisit.",
    icon: LayoutDashboard,
  },
  {
    title: "stay in control",
    body: "manage access, privacy, and deletion.",
    icon: ShieldCheck,
  },
];

export default function SignInPage() {
  return (
    <section className="account-route sign-in-route" aria-labelledby="sign-in-route-title">
      <div className="account-route__hero sign-in-route__hero">
        <div className="account-route__hero-copy sign-in-route__copy">
          <p className="account-route__eyebrow">workspace access</p>
          <h1 id="sign-in-route-title">return to your workspace</h1>
          <p>sign in to reopen your workspace and continue where you left off.</p>
        </div>

        <aside
          className="account-route__summary account-route__returning sign-in-route__form"
          aria-label="sign in"
        >
          <p className="account-route__eyebrow">sign in</p>
          <h2>welcome back</h2>
          <AuthForm mode="sign-in" variant="compact" showSwitch={false} />
          <p className="auth-panel__switch sign-in-route__switch">
            new to Instalyzer? <Link href="/sign-up">create account</Link>
          </p>
        </aside>
      </div>

      <div className="account-route__grid sign-in-route__grid">
        {signInCards.map((card) => (
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
