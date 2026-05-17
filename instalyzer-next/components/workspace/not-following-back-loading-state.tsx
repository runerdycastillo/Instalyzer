import { ChevronLeft, Download, FolderKanban, Search, UserRoundX, Wrench } from "lucide-react";

const summaryCards = [
  { label: "pending", toneClassName: "is-pending" },
  { label: "unfollowed", toneClassName: "is-unfollowed" },
  { label: "review later", toneClassName: "is-review-later" },
  { label: "not found", toneClassName: "is-not-found" },
] as const;

const loadingRows = ["first", "second", "third", "fourth", "fifth"];

export function NotFollowingBackLoadingState() {
  return (
    <section
      className="dataset-workspace relationship-tool-loading"
      aria-busy="true"
      aria-labelledby="not-following-back-loading-title"
    >
      <div className="dataset-workspace__grid dataset-workspace__grid--static">
        <aside className="dataset-side-panel dataset-side-panel--left dataset-side-panel--loading">
          <div className="dataset-side-panel__head">
            <p className="section-kicker">current dataset</p>
            <div className="dataset-side-panel__dataset-block">
              <span className="dataset-skeleton-line dataset-skeleton-line--title" aria-hidden="true" />
              <span className="dataset-skeleton-line dataset-skeleton-line--meta" aria-hidden="true" />
            </div>
          </div>

          <div className="dataset-side-panel__body">
            <div className="dataset-side-panel__count-block">
              <span>saved datasets</span>
              <span className="dataset-skeleton-line dataset-skeleton-line--count" aria-hidden="true" />
            </div>

            <div className="dataset-side-panel__recent">
              <p className="dataset-side-panel__recent-label">recent datasets</p>
              <div className="dataset-side-panel__recent-list">
                {["active", "recent"].map((item, index) => (
                  <div
                    key={item}
                    className={`dataset-side-panel__recent-chip${index === 0 ? " is-active" : ""}`}
                  >
                    <span className="dataset-skeleton-line dataset-skeleton-line--recent" aria-hidden="true" />
                    <span className="dataset-skeleton-line dataset-skeleton-line--recent-meta" aria-hidden="true" />
                  </div>
                ))}
              </div>
            </div>

            <div className="dataset-side-panel__divider" aria-hidden="true" />

            <div className="hero-btn hero-btn-secondary dataset-side-panel__action dataset-side-panel__action--loading">
              <FolderKanban size={16} aria-hidden="true" />
              <span>manage datasets</span>
            </div>
          </div>
        </aside>

        <article className="dataset-workspace__surface dataset-workspace__surface--tool-loading">
          <div className="dataset-overview-head dataset-dashboard-section dataset-dashboard-section--header">
            <div>
              <p className="section-kicker">relationship tool</p>
              <h1 id="not-following-back-loading-title" className="dataset-overview-title">
                not following back
              </h1>
              <p className="dataset-overview-copy dataset-overview-copy--inline">
                preparing your review list.
              </p>
            </div>

            <div className="dataset-overview-meta dataset-overview-meta--loading">
              <span className="dataset-meta-value dataset-meta-value--link relationship-tool-loading__back">
                <ChevronLeft size={15} aria-hidden="true" />
                back to overview
              </span>
            </div>
          </div>

          <div className="relationship-tool relationship-tool--loading">
            <div className="relationship-tool__summary-grid" aria-hidden="true">
              {summaryCards.map((card, index) => (
                <article
                  key={card.label}
                  className={`relationship-tool__summary-card relationship-tool__summary-card--loading ${
                    card.toneClassName
                  }${index === 0 ? " is-active" : ""}`}
                >
                  <span className="relationship-tool__summary-head">
                    <span>{card.label}</span>
                    <i className="relationship-tool-loading__icon" aria-hidden="true" />
                  </span>
                  <span className="dataset-skeleton-line relationship-tool-loading__metric" />
                  <span className="dataset-skeleton-line relationship-tool-loading__small" />
                </article>
              ))}
            </div>

            <p className="relationship-tool__context relationship-tool__context--loading" aria-hidden="true">
              compared{" "}
              <span className="dataset-skeleton-line relationship-tool-loading__inline" /> followers against{" "}
              <span className="dataset-skeleton-line relationship-tool-loading__inline" /> following.
            </p>

            <div className="relationship-tool__toolbar" aria-hidden="true">
              <div className="relationship-tool__search relationship-tool__search--loading">
                <Search size={15} aria-hidden="true" />
                <span className="relationship-tool-loading__input">
                  <span className="dataset-skeleton-line relationship-tool-loading__search-line" />
                </span>
              </div>

              <div className="relationship-tool__toolbar-actions">
                <div className="relationship-tool__sort relationship-tool__sort--loading">
                  <span>sort</span>
                  <span className="relationship-tool__sort-control relationship-tool__sort-control--loading">
                    <span className="dataset-skeleton-line relationship-tool-loading__sort-line" />
                  </span>
                </div>

                <span className="relationship-tool__download-wrap">
                  <span className="hero-btn hero-btn-secondary relationship-tool__button relationship-tool__button--icon relationship-tool__button--loading">
                    <Download size={18} aria-hidden="true" />
                  </span>
                </span>
              </div>
            </div>

            <div className="relationship-tool__note-row relationship-tool__note-row--loading" aria-hidden="true">
              <p>
                <span className="dataset-skeleton-line relationship-tool-loading__note" />
              </p>
              <p className="relationship-tool__result-count">
                <span className="dataset-skeleton-line relationship-tool-loading__count" />
              </p>
            </div>

            <div className="relationship-tool__list-shell relationship-tool__list-shell--loading" aria-hidden="true">
              <ul className="relationship-tool__list relationship-tool__list--loading">
                {loadingRows.map((row) => (
                  <li key={row} className="relationship-tool__row relationship-tool__row--loading">
                    <div className="relationship-tool__row-main">
                      <span className="relationship-tool-loading__row-action" />
                      <div className="relationship-tool__row-copy">
                        <span className="dataset-skeleton-line relationship-tool-loading__row-handle" />
                        <span className="dataset-skeleton-line relationship-tool-loading__row-meta" />
                      </div>
                    </div>

                    <div className="relationship-tool-loading__row-actions">
                      <span className="relationship-tool-loading__row-icon" />
                      <span className="relationship-tool-loading__row-icon" />
                      <span className="relationship-tool-loading__row-icon" />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </article>

        <aside className="dataset-side-panel dataset-side-panel--right dataset-side-panel--loading">
          <div className="dataset-side-panel__head">
            <p className="section-kicker">workspace</p>
          </div>

          <div className="dataset-side-panel__body">
            <div className="workspace-tool-pill workspace-tool-pill--featured workspace-tool-pill--current is-live">
              <span className="workspace-tool-icon" aria-hidden="true">
                <UserRoundX size={16} strokeWidth={1.9} />
              </span>
              <span className="workspace-tool-copy">
                <span>not following back</span>
                <span>opening tool</span>
              </span>
            </div>

            <article className="dataset-workspace__support-card">
              <p className="dataset-meta-label">relationship signals</p>
              <div className="dataset-card__metrics dataset-card__metrics--compact">
                {["followers", "following", "pending", "reviewed"].map((label) => (
                  <div key={label}>
                    <span>{label}</span>
                    <span className="dataset-skeleton-line dataset-skeleton-line--metric" aria-hidden="true" />
                  </div>
                ))}
              </div>
            </article>

            <div className="hero-btn hero-btn-secondary dataset-side-panel__action dataset-side-panel__action--loading">
              <Wrench size={16} aria-hidden="true" />
              <span>tools</span>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
