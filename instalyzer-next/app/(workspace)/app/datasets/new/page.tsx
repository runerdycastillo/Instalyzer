import { Suspense } from "react";
import { DatasetCreationFlow } from "@/components/workspace/dataset-creation-flow";

function DatasetCreationFallback() {
  return (
    <section
      className="dataset-flow dataset-flow--loading"
      aria-labelledby="dataset-flow-loading-title"
      aria-busy="true"
    >
      <div className="dataset-flow__hero">
        <div className="section-intro dataset-flow__hero-copy">
          <p className="section-kicker">create dataset</p>
          <h1 id="dataset-flow-loading-title" className="section-title dataset-flow__hero-title">
            turn your export into a reusable dataset
          </h1>
          <p className="section-copy dataset-flow__description">
            preparing the upload workspace.
          </p>
        </div>
      </div>

      <div className="dataset-flow__steps" aria-hidden="true">
        <span className="dataset-flow__step is-active">upload</span>
        <span className="dataset-flow__step-chevron">
          <svg viewBox="0 0 24 24">
            <path d="m9 6 6 6-6 6" />
          </svg>
        </span>
        <span className="dataset-flow__step">create</span>
      </div>

      <div className="dataset-flow__grid is-upload-step">
        <article className="dataset-flow__panel dataset-flow__panel--primary dataset-flow__panel--loading">
          <div className="dataset-flow__stage">
            <div className="dataset-flow__copy">
              <p className="dataset-flow__kicker">step 1</p>
              <h2>upload your export</h2>
              <p>loading your private import surface.</p>
            </div>

            <div className="dataset-dropzone dataset-dropzone--loading">
              <span className="dataset-skeleton-line dataset-skeleton-line--title" />
              <span className="dataset-skeleton-line dataset-skeleton-line--body" />
              <span className="dataset-skeleton-line dataset-skeleton-line--meta" />
            </div>
          </div>
        </article>

        <aside className="dataset-flow__side dataset-flow__side--upload dataset-flow__side--loading" aria-hidden="true">
          <p className="guide-side-stack-label dataset-upload-tips-label">quick tips</p>
          <div className="guide-side-card guide-side-card-v2 guide-side-card-unified dataset-upload-tips-card">
            <span className="dataset-skeleton-line dataset-skeleton-line--recent" />
            <span className="dataset-skeleton-line dataset-skeleton-line--body" />
            <span className="dataset-skeleton-line dataset-skeleton-line--body" />
            <span className="dataset-skeleton-line dataset-skeleton-line--recent-meta" />
          </div>
        </aside>
      </div>
    </section>
  );
}

export default function NewDatasetPage() {
  return (
    <Suspense fallback={<DatasetCreationFallback />}>
      <DatasetCreationFlow />
    </Suspense>
  );
}
