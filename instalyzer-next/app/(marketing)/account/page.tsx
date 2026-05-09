import Link from "next/link";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { getCurrentUser } from "@/lib/firebase/admin";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <section className="account-route" aria-labelledby="account-route-title">
        <div className="account-route__hero">
          <span className="route-badge route-badge--marketing">account</span>
          <p className="route-path">/account</p>
          <h1 id="account-route-title">account access</h1>
          <p>
            sign in to connect your browser workspace to a secure account session before cloud dataset ownership turns on.
          </p>
          <div className="account-route__actions">
            <Link href="/sign-in" className="hero-btn hero-btn-primary">
              sign in
            </Link>
            <Link href="/sign-up" className="hero-btn hero-btn-secondary">
              create account
            </Link>
          </div>
        </div>

        <div className="account-route__grid">
          <article className="account-card">
            <h2>available now</h2>
            <p>email/password and google sign-in can create a secure session for this browser.</p>
          </article>
          <article className="account-card">
            <h2>next connection</h2>
            <p>saved dataset metadata will move behind authenticated ownership after the session loop is verified.</p>
          </article>
        </div>
      </section>
    );
  }

  return (
    <section className="account-route" aria-labelledby="account-route-title">
      <div className="account-route__hero">
        <span className="route-badge route-badge--marketing">signed in</span>
        <p className="route-path">/account</p>
        <h1 id="account-route-title">your account</h1>
        <p>your Firebase account is connected to a secure Instalyzer session cookie.</p>
        <div className="account-route__actions">
          <Link href="/app/datasets" className="hero-btn hero-btn-primary">
            open datasets
          </Link>
          <SignOutButton />
        </div>
      </div>

      <div className="account-route__grid">
        <article className="account-card">
          <h2>profile</h2>
          <dl className="account-route__details">
            <div>
              <dt>email</dt>
              <dd>{user.email || "not shared"}</dd>
            </div>
            <div>
              <dt>email status</dt>
              <dd>{user.emailVerified ? "verified" : "not verified"}</dd>
            </div>
            <div>
              <dt>user id</dt>
              <dd>{user.uid}</dd>
            </div>
          </dl>
        </article>

        <article className="account-card">
          <h2>session</h2>
          <p>
            refresh the page and this signed-in state should remain active until you sign out or the session expires.
          </p>
        </article>
      </div>
    </section>
  );
}
