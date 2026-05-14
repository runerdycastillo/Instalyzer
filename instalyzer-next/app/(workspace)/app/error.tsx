"use client";

import { Wrench } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

type WorkspaceErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function WorkspaceError({ error, reset }: WorkspaceErrorProps) {
  useEffect(() => {
    console.error("Instalyzer workspace route error", error);
  }, [error]);

  return (
    <section className="dataset-workspace dataset-workspace--empty" aria-labelledby="workspace-error-title">
      <article className="dataset-empty-state dataset-empty-state--error">
        <p className="section-kicker">workspace issue</p>

        <div className="dataset-empty-state__visual" aria-hidden="true">
          <div className="dataset-empty-state__visual-ring dataset-empty-state__visual-ring--outer" />
          <div className="dataset-empty-state__visual-ring dataset-empty-state__visual-ring--inner" />
          <div className="dataset-empty-state__visual-core">
            <Wrench strokeWidth={1.85} />
          </div>
        </div>

        <div className="dataset-empty-state__copy">
          <h1 id="workspace-error-title" className="dataset-empty-state__title">
            workspace did not load
          </h1>
          <p className="dataset-empty-state__description">
            try again, or return to your datasets if the workspace keeps stalling.
          </p>
        </div>

        <div className="dataset-empty-state__actions">
          <button type="button" className="hero-btn hero-btn-primary dataset-empty-state__cta" onClick={reset}>
            try again
          </button>
          <div className="dataset-empty-state__secondary-actions">
            <Link href="/app/datasets" className="dataset-empty-state__help">
              view datasets
            </Link>
            <Link href="/contact" className="dataset-empty-state__support">
              contact support
            </Link>
          </div>
        </div>
      </article>
    </section>
  );
}
