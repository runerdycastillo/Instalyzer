import Link from "next/link";
import { FileCheck2, LayoutDashboard, ShieldCheck } from "lucide-react";
import { AuthForm } from "@/components/auth/auth-form";

const signUpCards = [
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

export default function SignUpPage() {
  return (
    <section className="account-route sign-up-route" aria-labelledby="sign-up-route-title">
      <div className="account-route__hero sign-up-route__hero">
        <div className="account-route__hero-copy sign-up-route__copy">
          <p className="account-route__eyebrow">private workspace</p>
          <h1 id="sign-up-route-title">create your private workspace</h1>
          <p>
            save your instagram export workspace under your own account so it stays organized,
            reusable, and ready when you return.
          </p>
        </div>

        <aside
          className="account-route__summary account-route__returning sign-up-route__form"
          aria-label="create account"
        >
          <p className="account-route__eyebrow">create account</p>
          <h2>start here</h2>
          <AuthForm mode="sign-up" variant="compact" showSwitch={false} />
          <p className="auth-panel__switch sign-up-route__switch">
            have an account? <Link href="/sign-in">sign in</Link>
          </p>
        </aside>
      </div>

      <div className="account-route__grid sign-up-route__grid">
        {signUpCards.map((card) => (
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
