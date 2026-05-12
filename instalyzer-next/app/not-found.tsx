import Link from "next/link";

export default function NotFound() {
  return (
    <main className="route-state route-state--not-found" aria-labelledby="route-not-found-title">
      <section className="route-state__panel">
        <p className="section-kicker">not found</p>
        <h1 id="route-not-found-title">that page is not here</h1>
        <p>the link may have moved, or the local workspace route may no longer exist.</p>
        <div className="route-state__actions">
          <Link href="/account" className="hero-btn hero-btn-primary">
            account
          </Link>
          <Link href="/app/datasets" className="hero-btn hero-btn-secondary">
            workspace
          </Link>
        </div>
      </section>
    </main>
  );
}
