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
  const previewTags = ["not following back", "overview metrics", "workspace tools"];
  const trustNotes = ["official export", "no instagram login", "delete anytime"];

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
            workspace ready for your first dataset
          </h1>
          <p className="dataset-empty-state__description">
            upload your official instagram export to create a private workspace with overview metrics, relationship signals, and tools.
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
          <div className="dataset-empty-state__secondary-actions">
            <Link href="/help" className="dataset-empty-state__help">
              view export guide
            </Link>
            <Link href="/contact" className="dataset-empty-state__support">
              contact support
            </Link>
          </div>
        </div>

        <ul className="dataset-empty-state__trust" aria-label="Dataset privacy notes">
          {trustNotes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      </article>
    </section>
  );
}
