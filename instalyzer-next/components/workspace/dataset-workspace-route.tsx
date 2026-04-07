"use client";

import {
  ArrowDownUp,
  Check,
  ChartColumnBig,
  ChevronDown,
  Eye,
  FileText,
  FolderKanban,
  Pencil,
  Settings,
  Trash2,
  UserMinus,
  UsersRound,
  Wrench,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  readActiveDatasetId,
  DATASET_NAME_MAX_LENGTH,
  deleteLocalDataset,
  getLocalDatasetsServerSnapshot,
  findLocalDataset,
  hasReachedLocalDatasetLimit,
  LOCAL_DATASET_LIMIT_MESSAGE,
  MAX_LOCAL_DATASETS,
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

function getToolStatusLabel(status: "ready" | "partial" | "later") {
  switch (status) {
    case "ready":
      return "available now";
    case "partial":
      return "needs stronger export";
    default:
      return "coming soon";
  }
}

function getToolStatusClassName(status: "ready" | "partial" | "later") {
  switch (status) {
    case "ready":
      return "is-live";
    case "partial":
      return "is-partial";
    default:
      return "is-later";
  }
}

function WorkspaceLoadingState() {
  return (
    <section className="dataset-workspace" aria-busy="true" aria-label="Loading workspace">
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
                {["a", "b", "c"].map((item, index) => (
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

        <article className="dataset-workspace__surface dataset-workspace__surface--loading">
          <div className="dataset-overview-head">
            <div className="dataset-overview-head__loading">
              <p className="section-kicker">dataset overview</p>
              <span className="dataset-skeleton-line dataset-skeleton-line--hero-title" aria-hidden="true" />
              <span className="dataset-skeleton-line dataset-skeleton-line--body" aria-hidden="true" />
            </div>
            <div className="dataset-overview-meta dataset-overview-meta--loading">
              <span className="dataset-meta-label">created</span>
              <span className="dataset-skeleton-line dataset-skeleton-line--meta" aria-hidden="true" />
            </div>
          </div>

          <div className="dataset-overview-body">
            <div className="dataset-profile-band dataset-profile-band--loading">
              <div className="dataset-profile-avatar-shell">
                <div className="dataset-profile-avatar dataset-profile-avatar--loading" aria-hidden="true" />
              </div>

              <div className="dataset-profile-copy">
                <span className="dataset-skeleton-line dataset-skeleton-line--handle" aria-hidden="true" />
                <span className="dataset-skeleton-line dataset-skeleton-line--name" aria-hidden="true" />
                <span className="dataset-skeleton-line dataset-skeleton-line--meta" aria-hidden="true" />
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
                <article key={label} className="dataset-overview-card dataset-overview-card--loading">
                  <span className="dataset-meta-label">{label}</span>
                  <span className="dataset-skeleton-line dataset-skeleton-line--card-value" aria-hidden="true" />
                </article>
              ))}
            </div>

            <div className="dataset-workspace__notes">
              <span className="dataset-skeleton-line dataset-skeleton-line--body" aria-hidden="true" />
            </div>
          </div>
        </article>

        <aside className="dataset-side-panel dataset-side-panel--right dataset-side-panel--loading">
          <div className="dataset-side-panel__head">
            <p className="section-kicker">workspace</p>
          </div>

          <div className="dataset-side-panel__body">
            <div className="workspace-tool-pill workspace-tool-pill--featured">
              <span className="workspace-tool-icon" aria-hidden="true">
                <UserMinus size={16} strokeWidth={1.9} />
              </span>
              <span className="workspace-tool-copy">
                <span className="dataset-skeleton-line dataset-skeleton-line--tool" aria-hidden="true" />
              </span>
              <span className="workspace-tool-spacer" aria-hidden="true" />
            </div>

            <div className="hero-btn hero-btn-secondary dataset-side-panel__action dataset-side-panel__action--loading">
              <Wrench size={16} aria-hidden="true" />
              <span>tools</span>
            </div>

            <article className="dataset-workspace__support-card">
              <p className="dataset-meta-label">relationship signals</p>
              <div className="dataset-card__metrics dataset-card__metrics--compact">
                {["following", "followers", "mutuals", "not following back"].map((label) => (
                  <div key={label}>
                    <span>{label}</span>
                    <span className="dataset-skeleton-line dataset-skeleton-line--metric" aria-hidden="true" />
                  </div>
                ))}
              </div>
            </article>
          </div>
        </aside>
      </div>
    </section>
  );
}

export function DatasetWorkspaceRoute({ datasetId }: DatasetWorkspaceRouteProps) {
  const router = useRouter();
  const isWorkspaceHome = !datasetId;
  const [isDatasetsModalOpen, setIsDatasetsModalOpen] = useState(false);
  const [isToolsModalOpen, setIsToolsModalOpen] = useState(false);
  const [openDatasetMenuId, setOpenDatasetMenuId] = useState<string | null>(null);
  const [renamingDatasetId, setRenamingDatasetId] = useState<string | null>(null);
  const [datasetNameDraft, setDatasetNameDraft] = useState("");
  const [datasetSortOrder, setDatasetSortOrder] = useState<"latest" | "oldest" | "name">("latest");
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
  const [isHydrationSettled, setIsHydrationSettled] = useState(false);
  const [floatingPanelStyle, setFloatingPanelStyle] = useState<{
    position: "fixed";
    left: number;
    top: number;
    width: number;
    zIndex: number;
  } | null>(null);
  const sortMenuRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const rowActionsRef = useRef<HTMLDivElement | null>(null);
  const floatingPanelRef = useRef<HTMLDivElement | HTMLFormElement | null>(null);
  const menuTriggerRefs = useRef<Record<string, HTMLButtonElement | null>>({});
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

  function buildFloatingPanelStyle(
    anchor: HTMLButtonElement | null,
    panel: "menu" | "rename",
  ) {
    if (!anchor || typeof window === "undefined") {
      return null;
    }

    const anchorRect = anchor.getBoundingClientRect();
    const width = panel === "menu" ? 158 : Math.min(260, window.innerWidth - 72);
    const height = panel === "menu" ? 96 : 76;
    const gap = 10;
    const viewportPadding = 16;

    let left = anchorRect.left - width - gap;
    let top = anchorRect.top + anchorRect.height / 2 - height / 2;

    left = Math.max(viewportPadding, Math.min(left, window.innerWidth - width - viewportPadding));
    top = Math.max(viewportPadding, Math.min(top, window.innerHeight - height - viewportPadding));

    return {
      position: "fixed" as const,
      left,
      top,
      width,
      zIndex: 60,
    };
  }

  useEffect(() => {
    if (!isDatasetsModalOpen && !isToolsModalOpen) return undefined;

    const html = document.documentElement;
    const body = document.body;

    html.classList.add("modal-open");
    body.classList.add("modal-open");

    return () => {
      html.classList.remove("modal-open");
      body.classList.remove("modal-open");
    };
  }, [isDatasetsModalOpen, isToolsModalOpen]);

  useEffect(() => {
    if (!isDatasetsModalOpen || !isSortMenuOpen) return undefined;

    function handlePointerDown(event: PointerEvent) {
      if (!sortMenuRef.current?.contains(event.target as Node)) {
        setIsSortMenuOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [isDatasetsModalOpen, isSortMenuOpen]);

  useEffect(() => {
    if (!isDatasetsModalOpen || (!openDatasetMenuId && !renamingDatasetId)) return undefined;

    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (!rowActionsRef.current?.contains(target) && !floatingPanelRef.current?.contains(target)) {
        setOpenDatasetMenuId(null);
        setRenamingDatasetId(null);
        setDatasetNameDraft("");
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [isDatasetsModalOpen, openDatasetMenuId, renamingDatasetId]);

  useEffect(() => {
    if (!datasetId || !dataset) return;
    writeActiveDatasetId(dataset.id);
  }, [datasetId, dataset]);

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
    return <WorkspaceLoadingState />;
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
      <section className="dataset-workspace dataset-workspace--hydrated" aria-labelledby="dataset-workspace-title">
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
    const anchor = menuTriggerRefs.current[targetId];
    setIsSortMenuOpen(false);
    setOpenDatasetMenuId(null);
    setRenamingDatasetId(targetId);
    setDatasetNameDraft(currentName);
    setFloatingPanelStyle(anchor ? buildFloatingPanelStyle(anchor, "rename") : null);
  }

  function closeDatasetsModal() {
    setIsDatasetsModalOpen(false);
    setOpenDatasetMenuId(null);
    setRenamingDatasetId(null);
    setIsSortMenuOpen(false);
    setFloatingPanelStyle(null);
    setDatasetNameDraft("");
  }

  function cancelRenamingDataset() {
    setRenamingDatasetId(null);
    setFloatingPanelStyle(null);
    setDatasetNameDraft("");
  }

  function saveDatasetName(targetId: string) {
    const normalizedName = datasetNameDraft.trim().slice(0, DATASET_NAME_MAX_LENGTH);
    if (!normalizedName) return;

    updateLocalDatasetName(targetId, normalizedName);
    setRenamingDatasetId(null);
    setFloatingPanelStyle(null);
    setDatasetNameDraft("");
  }

  function removeDataset(targetId: string) {
    const nextDatasets = deleteLocalDataset(targetId);
    setIsSortMenuOpen(false);
    setOpenDatasetMenuId(null);
    setRenamingDatasetId(null);
    setFloatingPanelStyle(null);
    setDatasetNameDraft("");

    if (targetId !== dataset.id) return;

    closeDatasetsModal();
    router.push(nextDatasets[0] ? `/app/datasets/${nextDatasets[0].id}` : "/app/datasets");
  }

  const readyToolsCount = dataset.importReview.tools.filter((tool) => tool.status === "ready").length;
  const partialToolsCount = dataset.importReview.tools.filter((tool) => tool.status === "partial").length;
  const laterToolsCount = dataset.importReview.tools.filter((tool) => tool.status === "later").length;
  const notFollowingBackTotal = formatMetric(dataset.metrics?.notFollowingBackCount ?? null, "0");
  const recentDatasets = [
    dataset,
    ...datasets.filter((item) => item.id !== dataset.id),
  ].slice(0, 2);
  const sortedModalDatasets = [...datasets].sort((left, right) => {
    if (datasetSortOrder === "name") {
      return left.name.localeCompare(right.name, undefined, { sensitivity: "base" });
    }

    const dateCompare = left.createdAt.localeCompare(right.createdAt);
    return datasetSortOrder === "oldest" ? dateCompare : -dateCompare;
  });
  const hasReachedDatasetLimit = hasReachedLocalDatasetLimit(datasets);

  return (
    <section className="dataset-workspace dataset-workspace--hydrated" aria-labelledby="dataset-workspace-title">
      <div className="dataset-workspace__grid dataset-workspace__grid--static">
        <aside className="dataset-side-panel dataset-side-panel--left">
          <div className="dataset-side-panel__head">
            <p className="section-kicker">{isWorkspaceHome ? "workspace overview" : "current dataset"}</p>
            <div className="dataset-side-panel__dataset-block">
              <h2 className="tools-sidebar-title dataset-side-panel__title">{dataset.name}</h2>
            </div>
          </div>

          <div className="dataset-side-panel__body">
            <div className="dataset-side-panel__count-block">
              <span>saved datasets</span>
              <strong>{datasets.length}</strong>
            </div>

            <div className="dataset-side-panel__recent">
              <p className="dataset-side-panel__recent-label">recent datasets</p>
              <div className="dataset-side-panel__recent-list">
                {recentDatasets.map((item) => {
                  const isActiveDataset = item.id === dataset.id;

                  return (
                    <div
                      key={item.id}
                      className={`dataset-side-panel__recent-chip${isActiveDataset ? " is-active" : ""}`}
                    >
                      <span className="dataset-side-panel__recent-name">{item.name}</span>
                      <span className="dataset-side-panel__recent-meta">
                        {isActiveDataset ? "active now" : formatDate(item.createdAt)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="dataset-side-panel__divider" aria-hidden="true" />

            <button
              type="button"
              className="hero-btn hero-btn-secondary dataset-side-panel__action"
              onClick={() => setIsDatasetsModalOpen(true)}
            >
              <FolderKanban size={16} aria-hidden="true" />
              manage datasets
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
            className="dataset-modal dataset-modal--datasets"
            role="dialog"
            aria-modal="true"
            aria-labelledby="all-datasets-title"
            onClick={(event) => {
              event.stopPropagation();

              if (event.target === event.currentTarget) {
                setIsSortMenuOpen(false);
                setOpenDatasetMenuId(null);
                setRenamingDatasetId(null);
              }
            }}
          >
            <div className="dataset-modal__head">
              <div className="dataset-modal__head-copy">
                <p className="section-kicker">exports</p>
                <h2 id="all-datasets-title" className="tools-sidebar-title">
                  manage exports
                </h2>
                <p className="dataset-modal__copy">
                  switch between instagram exports
                </p>
                <div className="dataset-modal__toolbar">
                  <p className="dataset-modal__summary-text">
                    <span className="dataset-modal__summary-label">saved exports:</span>{" "}
                    <span className="dataset-modal__summary-value">{datasets.length}</span>
                  </p>
                  <div className="dataset-modal__sort-wrap" ref={sortMenuRef}>
                    <button
                      type="button"
                      className="dataset-modal__sort"
                      onClick={(event) => {
                        event.stopPropagation();
                        setOpenDatasetMenuId(null);
                        setRenamingDatasetId(null);
                        setIsSortMenuOpen((current) => !current);
                      }}
                      aria-haspopup="menu"
                      aria-expanded={isSortMenuOpen}
                      aria-label="Sort exports"
                    >
                      <span className="dataset-modal__sort-label">
                        <ArrowDownUp size={14} aria-hidden="true" />
                        sort
                      </span>
                      <span className="dataset-modal__sort-value">{datasetSortOrder}</span>
                      <ChevronDown size={14} aria-hidden="true" className="dataset-modal__sort-caret" />
                    </button>
                    {isSortMenuOpen ? (
                      <div
                        className="dataset-modal__menu dataset-modal__sort-menu"
                        role="menu"
                        aria-label="Sort exports"
                        onClick={(event) => event.stopPropagation()}
                      >
                        {(["latest", "oldest", "name"] as const).map((option) => (
                          <button
                            key={option}
                            type="button"
                            className={`dataset-modal__sort-option${datasetSortOrder === option ? " is-selected" : ""}`}
                            onClick={() => {
                              setDatasetSortOrder(option);
                              setOpenDatasetMenuId(null);
                              setRenamingDatasetId(null);
                              setIsSortMenuOpen(false);
                            }}
                            role="menuitemradio"
                            aria-checked={datasetSortOrder === option}
                          >
                            <span>{option}</span>
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="dataset-modal__close"
                onClick={closeDatasetsModal}
                aria-label="Close exports panel"
              >
                <X size={16} aria-hidden="true" />
              </button>
            </div>

            <div
              className="dataset-modal__list"
              ref={listRef}
              onScroll={() => {
                setOpenDatasetMenuId(null);
                setRenamingDatasetId(null);
                setFloatingPanelStyle(null);
              }}
            >
              {sortedModalDatasets.map((item) => {
                const isCurrentDataset = item.id === dataset.id;
                const isRenaming = renamingDatasetId === item.id;
                const isMenuOpen = openDatasetMenuId === item.id;
                const dateRangeLabel = item.scope?.insightDateRangeLabel || item.importReview.sourceLabel;

                return (
                  <div
                    key={item.id}
                    className={`dataset-modal__row${isCurrentDataset ? " is-current" : ""}`}
                  >
                    {isCurrentDataset ? (
                      <div className="dataset-modal__row-main">
                        <div className="dataset-modal__row-topline">
                          <strong>{item.name}</strong>
                          <div className="dataset-modal__row-topmeta">
                            <p className="dataset-modal__row-date">imported {formatDate(item.createdAt)}</p>
                            <span className={`dataset-modal__row-status${isCurrentDataset ? " is-current" : ""}`}>
                              {isCurrentDataset ? "current" : "saved"}
                            </span>
                          </div>
                        </div>
                        <p className="dataset-modal__row-subtitle">{dateRangeLabel}</p>
                      </div>
                    ) : (
                      <Link
                        href={`/app/datasets/${item.id}`}
                        className="dataset-modal__row-main"
                        onClick={closeDatasetsModal}
                      >
                        <div className="dataset-modal__row-topline">
                          <strong>{item.name}</strong>
                          <div className="dataset-modal__row-topmeta">
                            <p className="dataset-modal__row-date">imported {formatDate(item.createdAt)}</p>
                            <span className={`dataset-modal__row-status${isCurrentDataset ? " is-current" : ""}`}>
                              {isCurrentDataset ? "current" : "saved"}
                            </span>
                          </div>
                        </div>
                        <p className="dataset-modal__row-subtitle">{dateRangeLabel}</p>
                      </Link>
                    )}

                    <div
                      className="dataset-modal__row-actions"
                      ref={isMenuOpen || isRenaming ? rowActionsRef : undefined}
                    >
                      <button
                        type="button"
                        className="dataset-modal__menu-trigger"
                        ref={(node) => {
                          menuTriggerRefs.current[item.id] = node;
                        }}
                        onClick={(event) => {
                          event.stopPropagation();
                          const trigger = event.currentTarget;
                          setIsSortMenuOpen(false);
                          setRenamingDatasetId(null);
                          setOpenDatasetMenuId((currentId) => {
                            const nextId = currentId === item.id ? null : item.id;
                            setFloatingPanelStyle(nextId ? buildFloatingPanelStyle(trigger, "menu") : null);
                            return nextId;
                          });
                        }}
                        aria-label={`Open actions for ${item.name}`}
                        aria-expanded={isMenuOpen}
                      >
                        <Settings size={15} aria-hidden="true" />
                      </button>

                      {isMenuOpen
                        ? createPortal(
                            <div
                              ref={floatingPanelRef}
                              className="dataset-modal__menu"
                              style={floatingPanelStyle ?? undefined}
                              role="menu"
                              aria-label={`Actions for ${item.name}`}
                              onClick={(event) => event.stopPropagation()}
                            >
                              <button
                                type="button"
                                className="dataset-modal__menu-item"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  startRenamingDataset(item.id, item.name);
                                }}
                              >
                                <Pencil size={14} aria-hidden="true" />
                                <span>change name</span>
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
                            </div>,
                            document.body,
                          )
                        : null}
                      {isRenaming
                        ? createPortal(
                            <form
                              ref={floatingPanelRef}
                              className="dataset-modal__rename-popover"
                              style={floatingPanelStyle ?? undefined}
                              onSubmit={(event) => {
                                event.preventDefault();
                                event.stopPropagation();
                                saveDatasetName(item.id);
                              }}
                              onClick={(event) => event.stopPropagation()}
                            >
                              <div className="dataset-modal__rename-row">
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
                                    type="submit"
                                    className="dataset-modal__rename-icon"
                                    aria-label={`Save name for ${item.name}`}
                                  >
                                    <Check size={15} aria-hidden="true" />
                                  </button>
                                  <button
                                    type="button"
                                    className="dataset-modal__rename-icon dataset-modal__rename-icon--ghost"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      cancelRenamingDataset();
                                    }}
                                    aria-label={`Cancel renaming ${item.name}`}
                                  >
                                    <X size={15} aria-hidden="true" />
                                  </button>
                                </div>
                              </div>
                            </form>,
                            document.body,
                          )
                        : null}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="dataset-modal__footer">
              <p className="dataset-modal__footer-note">
                {hasReachedDatasetLimit
                  ? `saved export limit reached (${MAX_LOCAL_DATASETS}/${MAX_LOCAL_DATASETS}). delete one to add a new export.`
                  : "saved exports stay tied to the instagram archives already imported into your workspace."}
              </p>
              {hasReachedDatasetLimit ? (
                <span
                  className="dataset-modal__footer-cta is-disabled"
                  aria-disabled="true"
                  title={LOCAL_DATASET_LIMIT_MESSAGE}
                >
                  limit reached
                </span>
              ) : (
                <Link
                  href="/app/datasets/new?entry=workspace-shell"
                  className="dataset-modal__footer-cta"
                  onClick={closeDatasetsModal}
                >
                  new export
                </Link>
              )}
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
                <p className="dataset-modal__copy">
                  This panel shows which workspace tools are ready right now and which ones still need more product work.
                </p>
                <div className="dataset-modal__summary">
                  <span className="dataset-modal__summary-chip">{readyToolsCount} live</span>
                  {partialToolsCount ? (
                    <span className="dataset-modal__summary-chip">{partialToolsCount} partial</span>
                  ) : null}
                  <span className="dataset-modal__summary-chip">{laterToolsCount} queued</span>
                </div>
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
                const statusLabel = getToolStatusLabel(tool.status);
                const statusClassName = getToolStatusClassName(tool.status);

                return isAvailableTool ? (
                  <Link
                    key={tool.id}
                    href={`/app/datasets/${dataset.id}/tools/not-following-back`}
                    className={`dataset-tool-card ${statusClassName}`.trim()}
                    onClick={() => setIsToolsModalOpen(false)}
                  >
                    <div className="dataset-tool-card__head">
                      <span className="dataset-tool-card__icon" aria-hidden="true">
                        <Icon size={17} strokeWidth={1.9} />
                      </span>
                      <span className={`dataset-tool-card__badge ${statusClassName}`.trim()}>
                        {statusLabel}
                      </span>
                    </div>
                    <strong className="dataset-tool-card__title">{tool.title}</strong>
                    <p className="dataset-tool-card__note">{tool.note}</p>
                    <div className="dataset-tool-card__footer">
                      <span>{notFollowingBackTotal} accounts ready to review</span>
                      <span className="dataset-tool-card__action">open workspace</span>
                    </div>
                  </Link>
                ) : (
                  <div key={tool.id} className={`dataset-tool-card ${statusClassName}`.trim()}>
                    <div className="dataset-tool-card__head">
                      <span className="dataset-tool-card__icon" aria-hidden="true">
                        <Icon size={17} strokeWidth={1.9} />
                      </span>
                      <span className={`dataset-tool-card__badge ${statusClassName}`.trim()}>{statusLabel}</span>
                    </div>
                    <strong className="dataset-tool-card__title">{tool.title}</strong>
                    <p className="dataset-tool-card__note">{tool.note}</p>
                    <div className="dataset-tool-card__footer">
                      <span>{tool.status === "partial" ? "eligible after stronger import" : "held for upcoming release"}</span>
                    </div>
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
