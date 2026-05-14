"use client";

import { FolderKanban } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import {
  getLocalDatasetsServerSnapshot,
  getEntryPointLabel,
  hasReachedLocalDatasetLimit,
  LOCAL_DATASET_LIMIT_MESSAGE,
  readLocalDatasets,
  subscribeToLocalDatasets,
} from "@/lib/instagram/local-datasets";

function formatDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function DatasetsIndexLoadingState() {
  return (
    <section className="dataset-index dataset-index--loading" aria-busy="true" aria-labelledby="dataset-index-loading-title">
      <div className="dataset-index__hero">
        <span className="route-badge route-badge--workspace">workspace route</span>
        <p className="route-path">/app/datasets</p>
        <h1 id="dataset-index-loading-title">datasets</h1>
        <p className="dataset-index__description">checking your saved exports.</p>
      </div>

      <div className="dataset-index__grid" aria-hidden="true">
        {["one", "two", "three"].map((item) => (
          <article key={item} className="dataset-card dataset-card--loading">
            <div className="dataset-card__head">
              <div>
                <span className="dataset-skeleton-line dataset-skeleton-line--meta" />
                <span className="dataset-skeleton-line dataset-skeleton-line--title" />
              </div>
              <span className="dataset-skeleton-line dataset-skeleton-line--chip" />
            </div>
            <span className="dataset-skeleton-line dataset-skeleton-line--body" />
            <span className="dataset-skeleton-line dataset-skeleton-line--body" />
          </article>
        ))}
      </div>
    </section>
  );
}

function DatasetsIndexEmptyState() {
  return (
    <section className="dataset-index dataset-index--empty" aria-labelledby="dataset-index-title">
      <div className="dataset-index__hero">
        <span className="route-badge route-badge--workspace">workspace route</span>
        <p className="route-path">/app/datasets</p>
        <h1 id="dataset-index-title">datasets</h1>
        <p className="dataset-index__description">
          Saved Instagram exports will appear here after you create your first dataset.
        </p>
      </div>

      <article className="dataset-card dataset-card--empty dataset-index-empty-card">
        <div className="dataset-card__head">
          <div>
            <p className="dataset-card__eyebrow">no saved datasets</p>
            <h2>create your first dataset</h2>
          </div>
          <span className="dataset-index-empty-card__icon" aria-hidden="true">
            <FolderKanban size={20} strokeWidth={1.85} />
          </span>
        </div>

        <p className="dataset-card__copy">
          Upload an official Instagram export once, then return here to reopen the dataset,
          manage it, and use workspace tools.
        </p>

        <div className="dataset-index-empty-card__preview" aria-label="Dataset list preview">
          {["dataset cards", "saved exports", "workspace tools"].map((item) => (
            <span key={item} className="dataset-chip">
              {item}
            </span>
          ))}
        </div>

        <div className="route-links dataset-index-empty-card__actions">
          <Link href="/app/datasets/new?entry=datasets-index" className="hero-btn hero-btn-primary">
            create dataset
          </Link>
          <Link href="/help" className="hero-btn hero-btn-secondary">
            view export guide
          </Link>
        </div>
      </article>
    </section>
  );
}

export function DatasetsIndexRoute() {
  const hasMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const [isHydrationSettled, setIsHydrationSettled] = useState(false);
  const datasets = useSyncExternalStore(
    subscribeToLocalDatasets,
    readLocalDatasets,
    getLocalDatasetsServerSnapshot,
  );
  const hasReachedDatasetLimit = hasReachedLocalDatasetLimit(datasets);

  useEffect(() => {
    if (!hasMounted) return undefined;

    const settleTimer = window.setTimeout(() => {
      setIsHydrationSettled(true);
    }, 140);

    return () => {
      window.clearTimeout(settleTimer);
    };
  }, [hasMounted]);

  if (!hasMounted || !isHydrationSettled) {
    return <DatasetsIndexLoadingState />;
  }

  if (!datasets.length) {
    return <DatasetsIndexEmptyState />;
  }

  return (
    <section className="dataset-index" aria-labelledby="dataset-index-title">
      <div className="dataset-index__hero">
        <span className="route-badge route-badge--workspace">workspace route</span>
        <p className="route-path">/app/datasets</p>
        <h1 id="dataset-index-title">datasets</h1>
        <p className="dataset-index__description">
          Reusable Instagram imports live here. Each dataset becomes the anchor for
          the workspace and every tool we add next.
        </p>
      </div>

      <div className="dataset-index__actions">
        {hasReachedDatasetLimit ? (
          <div className="dataset-index__limit-note">
            <span className="hero-btn hero-btn-primary is-disabled" aria-disabled="true">
              export limit reached
            </span>
            <p>{LOCAL_DATASET_LIMIT_MESSAGE}</p>
          </div>
        ) : (
          <Link href="/app/datasets/new?entry=datasets-index" className="hero-btn hero-btn-primary">
            create dataset
          </Link>
        )}
      </div>

      <div className="dataset-index__grid">
        {datasets.map((dataset) => (
          <article key={dataset.id} className="dataset-card">
            <div className="dataset-card__head">
              <div>
                <p className="dataset-card__eyebrow">{getEntryPointLabel(dataset.entryPoint)}</p>
                <h2>{dataset.name}</h2>
              </div>
              <span className="dataset-chip">{dataset.importReview.sourceLabel}</span>
            </div>

            <p className="dataset-card__copy">{dataset.importReview.uploadSummary}</p>

            <div className="dataset-card__metrics">
              <div>
                <span>created</span>
                <strong>{formatDate(dataset.createdAt)}</strong>
              </div>
              <div>
                <span>files</span>
                <strong>{dataset.importReview.fileCount}</strong>
              </div>
              <div>
                <span>categories</span>
                <strong>{dataset.importReview.categoryCount}</strong>
              </div>
            </div>

            <div className="dataset-chip-row">
              {dataset.importReview.categoryLabels.map((label) => (
                <span key={label} className="dataset-chip">
                  {label}
                </span>
              ))}
            </div>

            <div className="route-links">
              <Link href={`/app/datasets/${dataset.id}`} className="route-link">
                open workspace
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
