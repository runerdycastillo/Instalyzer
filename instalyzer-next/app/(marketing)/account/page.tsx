import Link from "next/link";
import { FileCheck2, LayoutDashboard, ShieldCheck } from "lucide-react";
import { AuthForm } from "@/components/auth/auth-form";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { getCurrentUser } from "@/lib/firebase/admin";

export const dynamic = "force-dynamic";

const signedOutCards = [
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

export default async function AccountPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <section className="account-route account-route--signed-out" aria-labelledby="account-route-title">
        <div className="account-route__hero">
          <div className="account-route__hero-copy">
            <p className="account-route__eyebrow">personal workspace</p>
            <h1 id="account-route-title">create your personal workspace</h1>
            <p>
              save your instagram export workspace under your own account so it stays organized,
              reusable, and ready when you return.
            </p>
            <div className="account-route__actions">
              <Link href="/sign-up" className="hero-btn hero-btn-primary">
                sign up
              </Link>
            </div>
          </div>

          <aside className="account-route__summary account-route__returning" aria-label="returning users">
            <p className="account-route__eyebrow">have an account?</p>
            <h2>welcome back</h2>
            <AuthForm mode="sign-in" variant="compact" showSwitch={false} />
            <p className="auth-panel__switch account-route__switch">
              don&apos;t have an account? <Link href="/sign-up">sign up</Link>
            </p>
          </aside>
        </div>

        <div className="account-route__grid">
          {signedOutCards.map((card) => (
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

  return (
    <section className="account-route account-route--signed-in" aria-labelledby="account-route-title">
      <div className="account-route__hero">
        <div className="account-route__hero-copy">
          <p className="account-route__eyebrow">personal workspace</p>
          <h1 id="account-route-title">your personal workspace</h1>
          <p>manage your workspace access, dataset status, and account settings.</p>
          <div className="account-route__actions">
            <Link href="/app/datasets" className="hero-btn hero-btn-primary">
              open workspace
            </Link>
            <Link href="/data-deletion-request" className="hero-btn hero-btn-secondary">
              manage data
            </Link>
            <SignOutButton />
          </div>
        </div>

        <aside className="account-route__summary" aria-label="workspace status">
          <h2>workspace status</h2>
          <ul>
            <li>
              <strong>ready</strong>
              <span>open your workspace, upload an export, or continue where you left off.</span>
            </li>
            <li>
              <strong>connected to you</strong>
              <span>{user.email || "your account is ready for workspace access."}</span>
            </li>
          </ul>
        </aside>
      </div>

      <div className="account-route__grid">
        <article className="account-card">
          <p className="account-card__eyebrow">status: ready</p>
          <h2>workspace</h2>
          <p>open your workspace, upload an export, or continue where you left off.</p>
        </article>

        <article className="account-card">
          <h2>account</h2>
          <dl className="account-route__details">
            <div>
              <dt>signed in as</dt>
              <dd>{user.email || "not shared"}</dd>
            </div>
          </dl>
        </article>

        <article className="account-card">
          <h2>data control</h2>
          <p>request deletion, review privacy, or manage your export workspace.</p>
        </article>
      </div>
    </section>
  );
}
