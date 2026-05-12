"use client";

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
        <p className="section-kicker">something went wrong</p>
        <h1 id="route-error-title">we hit a snag</h1>
        <p>try again, or return to your workspace if this keeps happening.</p>
        <div className="route-state__actions">
          <button type="button" className="hero-btn hero-btn-primary" onClick={reset}>
            try again
          </button>
          <a href="/account" className="hero-btn hero-btn-secondary">
            account
          </a>
        </div>
      </section>
    </main>
  );
}
