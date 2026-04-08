"use client";

import { FileArchive } from "lucide-react";
import Link from "next/link";

type DatasetWorkspaceEmptyStateProps = {
  createEntryPoint: "app-home" | "datasets-index";
};

export function DatasetWorkspaceEmptyState({
  createEntryPoint,
}: DatasetWorkspaceEmptyStateProps) {
  const createHref = `/app/datasets/new?entry=${createEntryPoint}`;
  const previewTags = ["not following back", "audience insights", "content interactions"];

  return (
    <section
      className="dataset-workspace dataset-workspace--hydrated dataset-workspace--empty"
      aria-labelledby="dataset-workspace-title"
    >
      <article className="dataset-empty-state">
        <p className="section-kicker">workspace overview</p>

        <div className="dataset-empty-state__visual" aria-hidden="true">
          <div className="dataset-empty-state__visual-ring dataset-empty-state__visual-ring--outer" />
          <div className="dataset-empty-state__visual-ring dataset-empty-state__visual-ring--inner" />
          <div className="dataset-empty-state__visual-core">
            <FileArchive strokeWidth={1.85} />
          </div>
        </div>

        <div className="dataset-empty-state__copy">
          <h1 id="dataset-workspace-title" className="dataset-empty-state__title">
            no dataset yet
          </h1>
          <p className="dataset-empty-state__description">
            upload your instagram export to unlock your relationship signals, overview metrics, and workspace tools.
          </p>
        </div>

        <div className="dataset-empty-state__pills" aria-label="workspace preview tools">
          {previewTags.map((tag) => (
            <span key={tag} className="dataset-empty-state__pill">
              {tag}
            </span>
          ))}
        </div>

        <div className="dataset-empty-state__actions">
          <Link href={createHref} className="hero-btn hero-btn-primary dataset-empty-state__cta">
            create dataset
          </Link>
          <Link href="/help" className="dataset-empty-state__help">
            need help exporting your instagram data?
          </Link>
        </div>

        <p className="dataset-empty-state__note">
          your workspace will automatically populate after import.
        </p>
      </article>
    </section>
  );
}
