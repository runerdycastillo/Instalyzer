"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import { DatasetWorkspaceEmptyState } from "@/components/workspace/dataset-workspace-empty-state";
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
    return <DatasetWorkspaceEmptyState createEntryPoint="datasets-index" />;
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
