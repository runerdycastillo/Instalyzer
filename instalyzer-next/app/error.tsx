"use client";

import Link from "next/link";
import { useEffect } from "react";

type AppErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function AppError({ error, reset }: AppErrorProps) {
  useEffect(() => {
    console.error("Instalyzer route error", error);
  }, [error]);

  return (
    <main className="route-state route-state--error" aria-labelledby="route-error-title">
      <section className="route-state__panel">
        <p className="section-kicker">app issue</p>
        <h1 id="route-error-title">something went wrong</h1>
        <p>try again, or head home if this keeps happening.</p>
        <div className="route-state__actions">
          <button type="button" className="hero-btn hero-btn-primary" onClick={reset}>
            try again
          </button>
          <Link href="/" className="hero-btn hero-btn-secondary">
            home
          </Link>
        </div>
      </section>
    </main>
  );
}
