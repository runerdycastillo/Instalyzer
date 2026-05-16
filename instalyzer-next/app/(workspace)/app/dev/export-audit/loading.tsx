export default function ExportAuditLoading() {
  return (
    <section className="export-audit-route" aria-busy="true" aria-labelledby="export-audit-loading-title">
      <div className="export-audit-route__intro">
        <p className="section-kicker">accuracy audit</p>
        <h1 id="export-audit-loading-title" className="section-title export-audit-route__title">
          audit dataset
        </h1>
        <p className="section-copy export-audit-route__copy">
          preparing the audit workspace.
        </p>
      </div>

      <div className="export-audit-grid" aria-hidden="true">
        <article className="export-audit-card">
          <div className="export-audit-card__head">
            <h2>run audit</h2>
          </div>
          <span className="dataset-skeleton-line dataset-skeleton-line--body" />
          <span className="dataset-skeleton-line dataset-skeleton-line--meta" />
          <div className="export-audit-placeholder">
            <span className="dataset-skeleton-line dataset-skeleton-line--title" />
          </div>
        </article>

        <div className="export-audit-results-stack">
          <article className="export-audit-card export-audit-card--results">
            <div className="export-audit-card__head export-audit-card__head--comparison">
              <div className="export-audit-card__head-copy">
                <h2>comparison</h2>
              </div>
            </div>
            <div className="export-audit-placeholder">
              <span className="dataset-skeleton-line dataset-skeleton-line--body" />
            </div>
          </article>

          <div className="export-audit-info-grid">
            <article className="export-audit-info-card">
              <span>reference</span>
              <strong>loading</strong>
              <small>checking saved dataset</small>
            </article>
            <article className="export-audit-info-card">
              <span>audit source</span>
              <strong>loading</strong>
              <small>waiting for ZIP details</small>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
}
