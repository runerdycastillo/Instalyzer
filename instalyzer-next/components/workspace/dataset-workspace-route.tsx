"use client";

import {
  ChartColumnBig,
  Ellipsis,
  Eye,
  FileText,
  FolderKanban,
  Pencil,
  Trash2,
  UserMinus,
  UsersRound,
  Wrench,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import {
  readActiveDatasetId,
  DATASET_NAME_MAX_LENGTH,
  deleteLocalDataset,
  getLocalDatasetsServerSnapshot,
  findLocalDataset,
  readLocalDatasets,
  subscribeToLocalDatasets,
  updateLocalDatasetName,
  writeActiveDatasetId,
} from "@/lib/instagram/local-datasets";

type DatasetWorkspaceRouteProps = {
  datasetId?: string;
};

function formatDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatMetric(value: number | null | undefined, fallback = "Not available") {
  const number = Number(value);
  return Number.isFinite(number) ? number.toLocaleString() : fallback;
}

function getDisplayName(dataset: NonNullable<ReturnType<typeof findLocalDataset>>) {
  return dataset.profile?.displayName || (dataset.profile?.username ? `@${dataset.profile.username}` : dataset.name);
}

function getHandle(dataset: NonNullable<ReturnType<typeof findLocalDataset>>) {
  return dataset.profile?.username ? `@${dataset.profile.username}` : "instagram dataset";
}

function getInstagramProfileHref(dataset: NonNullable<ReturnType<typeof findLocalDataset>>) {
  const username = dataset.profile?.username?.trim();
  return username ? `https://www.instagram.com/${username}/` : "";
}

function getWorkspaceToolIcon(toolId: string) {
  switch (toolId) {
    case "not-following-back":
      return UserMinus;
    case "audience-insights":
      return UsersRound;
    case "reach-summary":
      return Eye;
    case "content-interactions":
      return ChartColumnBig;
    default:
      return FileText;
  }
}

export function DatasetWorkspaceRoute({ datasetId }: DatasetWorkspaceRouteProps) {
  const router = useRouter();
  const isWorkspaceHome = !datasetId;
  const [isDatasetsModalOpen, setIsDatasetsModalOpen] = useState(false);
  const [isToolsModalOpen, setIsToolsModalOpen] = useState(false);
  const [openDatasetMenuId, setOpenDatasetMenuId] = useState<string | null>(null);
  const [renamingDatasetId, setRenamingDatasetId] = useState<string | null>(null);
  const [datasetNameDraft, setDatasetNameDraft] = useState("");
  const hasMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const datasets = useSyncExternalStore(
    subscribeToLocalDatasets,
    readLocalDatasets,
    getLocalDatasetsServerSnapshot,
  );
  const activeDatasetId = hasMounted ? readActiveDatasetId() : null;
  const dataset = datasetId
    ? datasets.find((item) => item.id === datasetId) || findLocalDataset(datasetId)
    : datasets.find((item) => item.id === activeDatasetId) || datasets[0] || null;

  useEffect(() => {
    if (!isDatasetsModalOpen && !isToolsModalOpen) return undefined;

    const html = document.documentElement;
    const body = document.body;
    const previousHtmlOverflow = html.style.overflow;
    const previousBodyOverflow = body.style.overflow;
    const previousHtmlPaddingRight = html.style.paddingRight;
    const previousBodyPaddingRight = body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - html.clientWidth;

    html.classList.add("modal-open");
    body.classList.add("modal-open");
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      html.style.paddingRight = `${scrollbarWidth}px`;
      body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      html.classList.remove("modal-open");
      body.classList.remove("modal-open");
      html.style.overflow = previousHtmlOverflow;
      body.style.overflow = previousBodyOverflow;
      html.style.paddingRight = previousHtmlPaddingRight;
      body.style.paddingRight = previousBodyPaddingRight;
    };
  }, [isDatasetsModalOpen, isToolsModalOpen]);

  useEffect(() => {
    if (!datasetId || !dataset) return;
    writeActiveDatasetId(dataset.id);
  }, [datasetId, dataset]);

  if (!hasMounted) {
    return (
      <section className="dataset-workspace" aria-busy="true">
        <article className="dataset-card dataset-card--empty">
          <h1>loading dataset</h1>
          <p>Preparing your saved workspace view.</p>
        </article>
      </section>
    );
  }

  if (!dataset && datasetId) {
    return (
      <section className="dataset-workspace">
        <article className="dataset-card dataset-card--empty">
          <h1>dataset not found</h1>
          <p>
            This workspace route is wired, but there is no saved local dataset for
            <code> {datasetId}</code> right now.
          </p>
          <div className="route-links">
            <Link href="/app/datasets" className="route-link">
              back to datasets
            </Link>
            <Link href="/app/datasets/new?entry=workspace-shell" className="route-link">
              create dataset
            </Link>
          </div>
        </article>
      </section>
    );
  }

  if (!dataset) {
    return (
      <section className="dataset-workspace" aria-labelledby="dataset-workspace-title">
        <div className="dataset-workspace__grid dataset-workspace__grid--static">
          <aside className="dataset-side-panel dataset-side-panel--left">
            <div className="dataset-side-panel__head">
              <p className="section-kicker">workspace overview</p>
              <h2 className="tools-sidebar-title dataset-side-panel__title">no dataset yet</h2>
            </div>

            <div className="dataset-side-panel__body">
              <p className="dataset-overview-copy">Upload an Instagram export to start your workspace.</p>

              <div className="dataset-card__metrics dataset-card__metrics--compact">
                <div>
                  <span>saved datasets</span>
                  <strong>0</strong>
                </div>
                <div>
                  <span>status</span>
                  <strong>ready to create</strong>
                </div>
              </div>

              <Link href="/app/datasets/new?entry=app-home" className="hero-btn hero-btn-primary dataset-side-panel__action">
                create dataset
              </Link>
            </div>
          </aside>

          <article className="dataset-workspace__surface">
            <div className="dataset-overview-head">
              <div>
                <p className="section-kicker">workspace overview</p>
                <h1 id="dataset-workspace-title" className="dataset-overview-title">
                  no data available yet
                </h1>
              </div>
            </div>

            <div className="dataset-overview-body">
              <div className="dataset-overview-intro">
                <p className="dataset-overview-copy">
                  Upload your Instagram export to unlock your saved overview, relationship signals, and tools.
                </p>
              </div>

              <div className="dataset-profile-band dataset-profile-band--empty">
                <div className="dataset-profile-avatar-shell">
                  <div className="dataset-profile-avatar dataset-profile-avatar--fallback">I</div>
                </div>

                <div className="dataset-profile-copy">
                  <p className="dataset-profile-handle">@youraccount</p>
                  <h3 className="dataset-profile-name">workspace waiting for your first export</h3>
                  <p className="dataset-profile-range">Import one JSON or ZIP export to populate this overview.</p>
                </div>
              </div>

              <div className="dataset-overview-grid">
                {[
                  "followers",
                  "accounts reached",
                  "profile visits",
                  "external link taps",
                  "content interactions",
                  "accounts engaged",
                  "impressions",
                  "categories detected",
                  "import source",
                ].map((label) => (
                  <article key={label} className="dataset-overview-card dataset-overview-card--empty">
                    <span className="dataset-meta-label">{label}</span>
                    <strong className="dataset-overview-value">-</strong>
                  </article>
                ))}
              </div>

              <div className="dataset-workspace__notes">
                <p className="dataset-overview-copy">
                  No export loaded yet. Create your first dataset and this page will become your overview hub.
                </p>
                <div className="route-links">
                  <Link href="/app/datasets/new?entry=app-home" className="route-link">
                    upload export
                  </Link>
                  <Link href="/help" className="route-link">
                    export help
                  </Link>
                </div>
              </div>
            </div>
          </article>

          <aside className="dataset-side-panel dataset-side-panel--right">
            <div className="dataset-side-panel__head">
              <p className="section-kicker">workspace</p>
            </div>

            <div className="dataset-side-panel__body">
              <div className="workspace-tool-pill workspace-tool-pill--current" aria-label="No tool selected">
                <span className="workspace-tool-placeholder">no tool selected</span>
              </div>

              <Link href="/app/datasets/new?entry=app-home" className="hero-btn hero-btn-secondary dataset-side-panel__action">
                create dataset
              </Link>

              <article className="dataset-workspace__support-card">
                <p className="dataset-meta-label">relationship signals</p>
                <div className="dataset-card__metrics dataset-card__metrics--compact">
                  <div>
                    <span>following</span>
                    <strong>0</strong>
                  </div>
                  <div>
                    <span>followers</span>
                    <strong>0</strong>
                  </div>
                  <div>
                    <span>mutuals</span>
                    <strong>0</strong>
                  </div>
                  <div>
                    <span>not following back</span>
                    <strong>0</strong>
                  </div>
                </div>
              </article>
            </div>
          </aside>
        </div>
      </section>
    );
  }

  function startRenamingDataset(targetId: string, currentName: string) {
    setOpenDatasetMenuId(null);
    setRenamingDatasetId(targetId);
    setDatasetNameDraft(currentName);
  }

  function closeDatasetsModal() {
    setIsDatasetsModalOpen(false);
    setOpenDatasetMenuId(null);
    setRenamingDatasetId(null);
    setDatasetNameDraft("");
  }

  function cancelRenamingDataset() {
    setRenamingDatasetId(null);
    setDatasetNameDraft("");
  }

  function saveDatasetName(targetId: string) {
    const normalizedName = datasetNameDraft.trim().slice(0, DATASET_NAME_MAX_LENGTH);
    if (!normalizedName) return;

    updateLocalDatasetName(targetId, normalizedName);
    setRenamingDatasetId(null);
    setDatasetNameDraft("");
  }

  function removeDataset(targetId: string) {
    const nextDatasets = deleteLocalDataset(targetId);
    setOpenDatasetMenuId(null);
    setRenamingDatasetId(null);
    setDatasetNameDraft("");

    if (targetId !== dataset.id) return;

    closeDatasetsModal();
    router.push(nextDatasets[0] ? `/app/datasets/${nextDatasets[0].id}` : "/app/datasets");
  }

  return (
    <section className="dataset-workspace" aria-labelledby="dataset-workspace-title">
      <div className="dataset-workspace__grid dataset-workspace__grid--static">
        <aside className="dataset-side-panel dataset-side-panel--left">
          <div className="dataset-side-panel__head">
            <p className="section-kicker">{isWorkspaceHome ? "workspace overview" : "current dataset"}</p>
            <h2 className="tools-sidebar-title dataset-side-panel__title">{dataset.name}</h2>
          </div>

          <div className="dataset-side-panel__body">
            <div className="dataset-card__metrics dataset-card__metrics--compact">
              <div>
                <span>saved datasets</span>
                <strong>{datasets.length}</strong>
              </div>
            </div>

            <button
              type="button"
              className="hero-btn hero-btn-secondary dataset-side-panel__action"
              onClick={() => setIsDatasetsModalOpen(true)}
            >
              <FolderKanban size={16} aria-hidden="true" />
              datasets
            </button>
          </div>
        </aside>

        <article className="dataset-workspace__surface">
          <div className="dataset-overview-head">
            <div>
              <p className="section-kicker">{isWorkspaceHome ? "workspace overview" : "dataset overview"}</p>
              <h1 id="dataset-workspace-title" className="dataset-overview-title">
                {isWorkspaceHome ? "current workspace overview" : dataset.name}
              </h1>
              {isWorkspaceHome ? (
                <p className="dataset-overview-copy dataset-overview-copy--inline">
                  Showing your latest saved dataset: <strong>{dataset.name}</strong>
                </p>
              ) : null}
            </div>
            <div className="dataset-overview-meta">
              <span className="dataset-meta-label">{isWorkspaceHome ? "latest import" : "created"}</span>
              <span className="dataset-meta-value">{formatDate(dataset.createdAt)}</span>
            </div>
          </div>

          <div className="dataset-overview-body">
            <div className="dataset-overview-intro">
              <p className="dataset-overview-copy">
                Trusted account and insight metrics extracted from this imported Instagram dataset.
              </p>
            </div>

            <div className="dataset-profile-band">
              {getInstagramProfileHref(dataset) ? (
                <a
                  href={getInstagramProfileHref(dataset)}
                  className="dataset-profile-link"
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label="Open Instagram profile"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <rect x="3" y="3" width="18" height="18" rx="5" />
                    <circle cx="12" cy="12" r="4" />
                    <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none" />
                  </svg>
                </a>
              ) : null}

              <div className="dataset-profile-avatar-shell">
                <div className="dataset-profile-avatar dataset-profile-avatar--fallback">
                  {dataset.profile?.username?.slice(0, 1).toUpperCase() || "I"}
                </div>
              </div>

              <div className="dataset-profile-copy">
                <p className="dataset-profile-handle">{getHandle(dataset)}</p>
                <h3 className="dataset-profile-name">{getDisplayName(dataset)}</h3>
                <p className="dataset-profile-range">
                  {dataset.scope?.insightDateRangeLabel || "insight range not detected"}
                </p>
              </div>
            </div>

            <div className="dataset-overview-grid">
              <article className="dataset-overview-card">
                <span className="dataset-meta-label">followers</span>
                <strong className="dataset-overview-value">
                  {formatMetric(dataset.metrics?.followerTotalFromInsights)}
                </strong>
              </article>

              <article className="dataset-overview-card">
                <span className="dataset-meta-label">accounts reached</span>
                <strong className="dataset-overview-value">
                  {formatMetric(dataset.metrics?.accountsReached)}
                </strong>
              </article>

              <article className="dataset-overview-card">
                <span className="dataset-meta-label">profile visits</span>
                <strong className="dataset-overview-value">
                  {formatMetric(dataset.metrics?.profileVisits)}
                </strong>
              </article>

              <article className="dataset-overview-card">
                <span className="dataset-meta-label">external link taps</span>
                <strong className="dataset-overview-value">
                  {formatMetric(dataset.metrics?.externalLinkTaps)}
                </strong>
              </article>

              <article className="dataset-overview-card">
                <span className="dataset-meta-label">content interactions</span>
                <strong className="dataset-overview-value">
                  {formatMetric(dataset.metrics?.contentInteractions)}
                </strong>
              </article>

              <article className="dataset-overview-card">
                <span className="dataset-meta-label">accounts engaged</span>
                <strong className="dataset-overview-value">
                  {formatMetric(dataset.metrics?.accountsEngaged)}
                </strong>
              </article>

              <article className="dataset-overview-card">
                <span className="dataset-meta-label">impressions</span>
                <strong className="dataset-overview-value">
                  {formatMetric(dataset.metrics?.impressions)}
                </strong>
              </article>

              <article className="dataset-overview-card">
                <span className="dataset-meta-label">categories detected</span>
                <strong className="dataset-overview-value">
                  {dataset.importReview.categoryCount}
                </strong>
              </article>

              <article className="dataset-overview-card">
                <span className="dataset-meta-label">import source</span>
                <strong className="dataset-overview-value">
                  {dataset.importReview.sourceLabel}
                </strong>
              </article>
            </div>

            <div className="dataset-workspace__notes">
              <p className="dataset-overview-copy">
                {isWorkspaceHome
                  ? "This is your workspace home. Switch datasets from the left and open tools from the right."
                  : dataset.importReview.readinessNote}
              </p>
            </div>
          </div>
        </article>

        <aside className="dataset-side-panel dataset-side-panel--right">
          <div className="dataset-side-panel__head">
            <p className="section-kicker">workspace</p>
          </div>

          <div className="dataset-side-panel__body">
            <Link
              href={`/app/datasets/${dataset.id}/tools/not-following-back`}
              className="workspace-tool-pill workspace-tool-pill--featured is-live"
              aria-label="Open not following back tool"
            >
              <span className="workspace-tool-icon" aria-hidden="true">
                <UserMinus size={16} strokeWidth={1.9} />
              </span>
              <span className="workspace-tool-copy">
                <strong>not following back</strong>
              </span>
              <span className="workspace-tool-spacer" aria-hidden="true" />
            </Link>

            <button
              type="button"
              className="hero-btn hero-btn-secondary dataset-side-panel__action"
              onClick={() => setIsToolsModalOpen(true)}
            >
              <Wrench size={16} aria-hidden="true" />
              tools
            </button>

            <article className="dataset-workspace__support-card">
              <p className="dataset-meta-label">relationship signals</p>
              <div className="dataset-card__metrics dataset-card__metrics--compact">
                <div>
                  <span>following</span>
                  <strong>{formatMetric(dataset.metrics?.followingCount ?? null, "0")}</strong>
                </div>
                <div>
                  <span>followers</span>
                  <strong>{formatMetric(dataset.metrics?.followerCount ?? null, "0")}</strong>
                </div>
                <div>
                  <span>mutuals</span>
                  <strong>{formatMetric(dataset.metrics?.mutualCount ?? null, "0")}</strong>
                </div>
                <div>
                  <span>not following back</span>
                  <strong>{formatMetric(dataset.metrics?.notFollowingBackCount ?? null, "0")}</strong>
                </div>
              </div>
            </article>
          </div>
        </aside>
      </div>

      {isDatasetsModalOpen ? (
        <div
          className="dataset-modal-backdrop dataset-modal-backdrop--datasets"
          role="presentation"
          onClick={closeDatasetsModal}
        >
          <div
            className="dataset-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="all-datasets-title"
            onClick={(event) => {
              event.stopPropagation();
              setOpenDatasetMenuId(null);
            }}
          >
            <div className="dataset-modal__head">
              <div>
                <p className="section-kicker">datasets</p>
                <h2 id="all-datasets-title" className="tools-sidebar-title">
                  all datasets
                </h2>
              </div>
              <button
                type="button"
                className="dataset-modal__close"
                onClick={closeDatasetsModal}
                aria-label="Close datasets panel"
              >
                <X size={16} aria-hidden="true" />
              </button>
            </div>

            <div className="dataset-modal__list">
              {datasets.map((item) => {
                const isCurrentDataset = item.id === dataset.id;
                const isRenaming = renamingDatasetId === item.id;
                const isMenuOpen = openDatasetMenuId === item.id;

                return (
                  <div
                    key={item.id}
                    className={`dataset-modal__row${isCurrentDataset ? " is-current" : ""}`}
                  >
                    {isCurrentDataset ? (
                      <div className="dataset-modal__row-main">
                        <strong>{item.name}</strong>
                        <p>{item.scope?.insightDateRangeLabel || item.importReview.sourceLabel}</p>
                      </div>
                    ) : (
                      <Link
                        href={`/app/datasets/${item.id}`}
                        className="dataset-modal__row-main"
                        onClick={closeDatasetsModal}
                      >
                        <strong>{item.name}</strong>
                        <p>{item.scope?.insightDateRangeLabel || item.importReview.sourceLabel}</p>
                      </Link>
                    )}

                    <div className="dataset-modal__row-actions">
                      <span className="dataset-modal__row-status">
                        {isCurrentDataset ? "current" : "open"}
                      </span>

                      <button
                        type="button"
                        className="dataset-modal__menu-trigger"
                        onClick={(event) => {
                          event.stopPropagation();
                          setOpenDatasetMenuId((currentId) => (currentId === item.id ? null : item.id));
                        }}
                        aria-label={`Open actions for ${item.name}`}
                        aria-expanded={isMenuOpen}
                      >
                        <Ellipsis size={16} aria-hidden="true" />
                      </button>

                      {isMenuOpen ? (
                        <div className="dataset-modal__menu" role="menu" aria-label={`Actions for ${item.name}`}>
                          <button
                            type="button"
                            className="dataset-modal__menu-item"
                            onClick={(event) => {
                              event.stopPropagation();
                              startRenamingDataset(item.id, item.name);
                            }}
                          >
                            <Pencil size={14} aria-hidden="true" />
                            <span>edit name</span>
                          </button>
                          <button
                            type="button"
                            className="dataset-modal__menu-item dataset-modal__menu-item--danger"
                            onClick={(event) => {
                              event.stopPropagation();
                              removeDataset(item.id);
                            }}
                          >
                            <Trash2 size={14} aria-hidden="true" />
                            <span>delete</span>
                          </button>
                        </div>
                      ) : null}
                    </div>

                    {isRenaming ? (
                      <form
                        className="dataset-modal__rename"
                        onSubmit={(event) => {
                          event.preventDefault();
                          saveDatasetName(item.id);
                        }}
                      >
                        <label className="dataset-modal__rename-label" htmlFor={`rename-${item.id}`}>
                          dataset name
                        </label>
                        <input
                          id={`rename-${item.id}`}
                          className="dataset-modal__rename-input"
                          value={datasetNameDraft}
                          maxLength={DATASET_NAME_MAX_LENGTH}
                          onChange={(event) => setDatasetNameDraft(event.target.value)}
                          autoFocus
                        />
                        <div className="dataset-modal__rename-actions">
                          <button
                            type="button"
                            className="dataset-modal__rename-button dataset-modal__rename-button--ghost"
                            onClick={cancelRenamingDataset}
                          >
                            cancel
                          </button>
                          <button type="submit" className="dataset-modal__rename-button">
                            save
                          </button>
                        </div>
                      </form>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}

      {isToolsModalOpen ? (
        <div
          className="dataset-modal-backdrop dataset-modal-backdrop--tools"
          role="presentation"
          onClick={() => setIsToolsModalOpen(false)}
        >
          <div
            className="dataset-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="all-tools-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="dataset-modal__head">
              <div>
                <p className="section-kicker">tools</p>
                <h2 id="all-tools-title" className="tools-sidebar-title">
                  all tools
                </h2>
              </div>
              <button
                type="button"
                className="dataset-modal__close"
                onClick={() => setIsToolsModalOpen(false)}
                aria-label="Close tools panel"
              >
                <X size={16} aria-hidden="true" />
              </button>
            </div>

            <div className="dataset-tools-grid">
              {dataset.importReview.tools.map((tool) => {
                const Icon = getWorkspaceToolIcon(tool.id);
                const isAvailableTool = tool.id === "not-following-back";
                const statusLabel =
                  tool.status === "ready"
                    ? "available now"
                    : tool.status === "partial"
                      ? "partial"
                      : "coming soon";

                return isAvailableTool ? (
                  <Link
                    key={tool.id}
                    href={`/app/datasets/${dataset.id}/tools/not-following-back`}
                    className={`dataset-tool-card${tool.status === "ready" ? " is-live" : ""}`}
                    onClick={() => setIsToolsModalOpen(false)}
                  >
                    <div className="dataset-tool-card__head">
                      <span className="dataset-tool-card__icon" aria-hidden="true">
                        <Icon size={17} strokeWidth={1.9} />
                      </span>
                      <span className={`dataset-tool-card__badge${tool.status === "ready" ? " is-live" : ""}`}>
                        {statusLabel}
                      </span>
                    </div>
                    <strong className="dataset-tool-card__title">{tool.title}</strong>
                  </Link>
                ) : (
                  <div key={tool.id} className="dataset-tool-card">
                    <div className="dataset-tool-card__head">
                      <span className="dataset-tool-card__icon" aria-hidden="true">
                        <Icon size={17} strokeWidth={1.9} />
                      </span>
                      <span className="dataset-tool-card__badge">{statusLabel}</span>
                    </div>
                    <strong className="dataset-tool-card__title">{tool.title}</strong>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
