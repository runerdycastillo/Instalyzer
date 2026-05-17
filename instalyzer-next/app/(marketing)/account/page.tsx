import Link from "next/link";
import {
  BookOpen,
  Database,
  FileCheck2,
  LayoutDashboard,
  ShieldCheck,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { AuthForm } from "@/components/auth/auth-form";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { type CurrentUser, getCurrentUser } from "@/lib/firebase/admin";

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

type AccountCardAction = {
  label: string;
  href: string;
  variant: "primary" | "secondary";
};

type SignedInCard = {
  title: string;
  body: string;
  icon: LucideIcon;
  actions: AccountCardAction[];
};

function getAccountLabel(user: CurrentUser) {
  return user.email || user.name || "your account";
}

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

  const accountLabel = getAccountLabel(user);
  const signedInCards: SignedInCard[] = [
    {
      title: "guide",
      body: "revisit the export steps and workspace walkthrough.",
      icon: BookOpen,
      actions: [
        { label: "open", href: "/help", variant: "secondary" },
      ],
    },
    {
      title: "storage",
      body: "saved exports are still browser-local until persistent storage ships.",
      icon: Database,
      actions: [
        { label: "open", href: "/app/datasets", variant: "secondary" },
      ],
    },
    {
      title: "data controls",
      body: "review privacy or request account and export data deletion.",
      icon: Trash2,
      actions: [
        { label: "privacy", href: "/privacy", variant: "secondary" },
        { label: "delete data", href: "/data-deletion-request", variant: "secondary" },
      ],
    },
  ];

  return (
    <section className="account-route account-route--signed-in" aria-labelledby="account-route-title">
      <div className="account-route__hero">
        <div className="account-route__hero-copy">
          <p className="account-route__eyebrow">signed in</p>
          <h1 id="account-route-title">welcome</h1>
          <p>import an instagram export or continue from your saved storage.</p>
          <div className="account-route__actions">
            <Link href="/app/datasets/new?entry=account" className="hero-btn hero-btn-primary">
              get started
            </Link>
          </div>
        </div>

        <aside className="account-route__summary account-route__summary--signed-in" aria-label="account status">
          <p className="account-route__eyebrow">access</p>
          <dl className="account-route__details account-route__details--compact">
            <div>
              <dt>email</dt>
              <dd>{accountLabel}</dd>
            </div>
            <div>
              <dt>plan</dt>
              <dd>basic</dd>
            </div>
          </dl>
          <SignOutButton />
        </aside>
      </div>

      <div className="account-route__grid">
        {signedInCards.map((card) => (
          <article className="account-card account-card--actionable" key={card.title}>
            <div className="account-card__head">
              <span className="account-card__icon" aria-hidden="true">
                <card.icon strokeWidth={1.9} />
              </span>
              <h2>{card.title}</h2>
            </div>
            <p>{card.body}</p>
            <div className="account-card__actions">
              {card.actions.map((action) => (
                <Link
                  href={action.href}
                  className={`account-card__link account-card__link--${action.variant}`}
                  key={action.label}
                >
                  {action.label}
                </Link>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
