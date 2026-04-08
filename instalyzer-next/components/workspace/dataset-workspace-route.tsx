"use client";

import {
  ArrowDownUp,
  Bookmark,
  CalendarDays,
  Check,
  ChevronDown,
  ExternalLink,
  FolderKanban,
  Globe2,
  Heart,
  MapPin,
  MessageCircle,
  Pencil,
  Settings,
  TrendingDown,
  TrendingUp,
  Trash2,
  UserMinus,
  VenusAndMars,
  Wrench,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { DatasetWorkspaceEmptyState } from "@/components/workspace/dataset-workspace-empty-state";
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
import { getSoftLaunchToolIcon, workspaceModalTools } from "@/lib/instagram/tool-catalog";

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

function formatSignedMetric(value: number | null | undefined, fallback = "Not available") {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return `${number > 0 ? "+" : ""}${number.toLocaleString()}`;
}

function formatPercent(value: number | null | undefined, fallback = "Not available") {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return `${number.toFixed(number % 1 === 0 ? 0 : 1)}%`;
}

function formatProperCaseLabel(value: string) {
  return value.replace(/\b([a-z])([a-z']*)/g, (_match, first: string, rest: string) => {
    return `${first.toUpperCase()}${rest.toLowerCase()}`;
  });
}

function getClampedPercent(value: number | null | undefined) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.max(0, Math.min(number, 100));
}

function getTrendTone(value: number | null | undefined) {
  const number = Number(value);
  if (!Number.isFinite(number) || number === 0) return "neutral";
  return number > 0 ? "positive" : "negative";
}

function getSplitRingMetrics(
  primaryPercent: number | null | undefined,
  secondaryPercent: number | null | undefined,
  radius = 34,
  gap = 4,
) {
  const primary = Number(primaryPercent);
  const secondary = Number(secondaryPercent);
  const circumference = 2 * Math.PI * radius;

  if (!Number.isFinite(primary) || !Number.isFinite(secondary)) {
    return null;
  }

  const total = primary + secondary;
  if (total <= 0) {
    return null;
  }

  const usableCircumference = Math.max(circumference - gap * 2, 0);
  const primaryLength = (usableCircumference * primary) / total;
  const secondaryLength = (usableCircumference * secondary) / total;

  return {
    radius,
    primaryPercentOfPath: (primaryLength / circumference) * 100,
    secondaryPercentOfPath: (secondaryLength / circumference) * 100,
    secondaryOffsetPercent: (-(primaryLength + gap) / circumference) * 100,
  };
}

function getReachRingMetrics(followerPercent: number | null | undefined, nonFollowerPercent: number | null | undefined) {
  const metrics = getSplitRingMetrics(followerPercent, nonFollowerPercent);
  if (!metrics) return null;

  return {
    radius: metrics.radius,
    followerPercentOfPath: metrics.primaryPercentOfPath,
    nonFollowerPercentOfPath: metrics.secondaryPercentOfPath,
    nonFollowerOffsetPercent: metrics.secondaryOffsetPercent,
  };
}

const monthIndex: Record<string, number> = {
  jan: 0,
  feb: 1,
  mar: 2,
  apr: 3,
  may: 4,
  jun: 5,
  jul: 6,
  aug: 7,
  sep: 8,
  oct: 9,
  nov: 10,
  dec: 11,
};

function formatOverviewWindow(scope?: {
  insightDateRangeLabel?: string;
  exportRequestEndTimestamp?: number | null;
}) {
  const rangeLabel = String(scope?.insightDateRangeLabel || "").trim();
  if (!rangeLabel) return "overview window not detected";

  const endTimestamp = Number(scope?.exportRequestEndTimestamp);
  if (!Number.isFinite(endTimestamp) || endTimestamp <= 0) {
    return rangeLabel;
  }

  const match = rangeLabel.match(
    /^([A-Za-z]{3})\s+(\d{1,2})\s*-\s*([A-Za-z]{3})\s+(\d{1,2})$/,
  );

  if (!match) return rangeLabel;

  const [, startMonthRaw, startDayRaw, endMonthRaw, endDayRaw] = match;
  const startMonth = monthIndex[startMonthRaw.toLowerCase()];
  const endMonth = monthIndex[endMonthRaw.toLowerCase()];
  const startDay = Number(startDayRaw);
  const endDay = Number(endDayRaw);

  if (
    startMonth === undefined ||
    endMonth === undefined ||
    !Number.isFinite(startDay) ||
    !Number.isFinite(endDay)
  ) {
    return rangeLabel;
  }

  const endReference = new Date(endTimestamp * 1000);
  const endYear = endReference.getFullYear();
  const startYear =
    startMonth > endMonth || (startMonth === endMonth && startDay > endDay) ? endYear - 1 : endYear;

  const startDate = new Date(startYear, startMonth, startDay);
  const endDate = new Date(endYear, endMonth, endDay);

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return rangeLabel;
  }

  const formatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return `${formatter.format(startDate)} - ${formatter.format(endDate)}`;
}

function getExportRangeLabel(scope?: {
  exportRequestRange?: "all_time" | "limited" | "unknown";
}) {
  if (scope?.exportRequestRange === "all_time") return "all-time export";
  if (scope?.exportRequestRange === "limited") return "limited export";
  return "export imported";
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
                {["followers", "following", "mutuals", "not following back"].map((label) => (
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
  const [datasetSortOrder, setDatasetSortOrder] = useState<"newest" | "oldest" | "a-z">("newest");
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
  const reachRingMetrics = getReachRingMetrics(
    dataset?.metrics?.reachFollowersPercent,
    dataset?.metrics?.reachNonFollowersPercent,
  );
  const genderRingMetrics = getSplitRingMetrics(
    dataset?.metrics?.womenFollowerPercent,
    dataset?.metrics?.menFollowerPercent,
    27,
    3,
  );
  const interactionMixItems = [
    {
      key: "likes",
      label: "likes",
      value: dataset?.metrics?.postLikes ?? null,
      icon: Heart,
    },
    {
      key: "comments",
      label: "comments",
      value: dataset?.metrics?.postComments ?? null,
      icon: MessageCircle,
    },
    {
      key: "saves",
      label: "saves",
      value: dataset?.metrics?.postSaves ?? null,
      icon: Bookmark,
    },
  ];
  const interactionMixTotal = interactionMixItems.reduce(
    (sum, item) => sum + (typeof item.value === "number" && Number.isFinite(item.value) ? item.value : 0),
    0,
  );

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
    return <DatasetWorkspaceEmptyState createEntryPoint="app-home" />;
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

  const recentDatasets = [
    dataset,
    ...datasets.filter((item) => item.id !== dataset.id),
  ].slice(0, 2);
  const sortedModalDatasets = [...datasets].sort((left, right) => {
    if (datasetSortOrder === "a-z") {
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
            <div className="dataset-profile-band">
              {getInstagramProfileHref(dataset) ? (
                <a
                  href={getInstagramProfileHref(dataset)}
                  className="dataset-profile-link"
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label="Open Instagram profile"
                  title="Open Instagram profile"
                >
                  <ExternalLink aria-hidden="true" strokeWidth={1.9} />
                </a>
              ) : null}

              <div className="dataset-profile-avatar-shell">
                {dataset.profile?.profilePhotoDataUrl ? (
                  <Image
                    src={dataset.profile.profilePhotoDataUrl}
                    alt={`${getDisplayName(dataset)} profile`}
                    className="dataset-profile-avatar dataset-profile-avatar--image"
                    width={88}
                    height={88}
                    unoptimized
                  />
                ) : (
                  <div className="dataset-profile-avatar dataset-profile-avatar--fallback">
                    {dataset.profile?.username?.slice(0, 1).toUpperCase() || "I"}
                  </div>
                )}
              </div>

              <div className="dataset-profile-copy">
                <p className="dataset-profile-handle">{getHandle(dataset)}</p>
                <h3 className="dataset-profile-name">{getDisplayName(dataset)}</h3>
                <p className="dataset-profile-range">
                  overview window: {formatOverviewWindow(dataset.scope)}
                </p>
              </div>
            </div>

            <div className="dataset-overview-grid">
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

            </div>

            <div className="dataset-overview-support-grid">
              <article
                className={`dataset-overview-support-card dataset-overview-support-card--movement is-${getTrendTone(
                  dataset.metrics?.netFollowersInRange,
                )} dataset-overview-support-card--movement-slot`}
              >
                <div className="dataset-overview-support-head">
                  <span className="dataset-overview-panel-title">audience movement</span>
                </div>
                <div className="dataset-overview-movement-grid">
                  <div className="dataset-overview-movement-stat dataset-overview-movement-stat--positive">
                    <span>follows</span>
                    <strong>{formatSignedMetric(dataset.metrics?.followsInRange)}</strong>
                  </div>
                  <div className="dataset-overview-movement-stat dataset-overview-movement-stat--negative">
                    <span>unfollows</span>
                    <strong>
                      {typeof dataset.metrics?.unfollowsInRange === "number"
                        ? `-${formatMetric(dataset.metrics.unfollowsInRange, "0")}`
                        : "Not available"}
                    </strong>
                  </div>
                </div>
                <div className={`dataset-overview-movement-highlight is-${getTrendTone(dataset.metrics?.netFollowersInRange)}`}>
                  <span>net follower change</span>
                  <div className="dataset-overview-movement-highlight__value">
                    {getTrendTone(dataset.metrics?.netFollowersInRange) === "positive" ? (
                      <TrendingUp size={18} aria-hidden="true" />
                    ) : getTrendTone(dataset.metrics?.netFollowersInRange) === "negative" ? (
                      <TrendingDown size={18} aria-hidden="true" />
                    ) : (
                      <ArrowDownUp size={18} aria-hidden="true" />
                    )}
                    <strong>{formatSignedMetric(dataset.metrics?.netFollowersInRange)}</strong>
                  </div>
                </div>
              </article>

              <article className="dataset-overview-support-card dataset-overview-support-card--reach">
                <div className="dataset-overview-support-head">
                  <span className="dataset-overview-panel-title">reach mix</span>
                </div>
                <div className="dataset-overview-ring-row">
                  <div className="dataset-overview-ring" aria-hidden="true">
                    {reachRingMetrics ? (
                      <svg className="dataset-overview-ring__svg" viewBox="0 0 96 96" aria-hidden="true">
                        <circle className="dataset-overview-ring__track" cx="48" cy="48" r="34" />
                        <circle
                          className="dataset-overview-ring__arc dataset-overview-ring__arc--followers"
                          cx="48"
                          cy="48"
                          r={reachRingMetrics.radius}
                          pathLength={100}
                          strokeDasharray={`${reachRingMetrics.followerPercentOfPath} 100`}
                          strokeDashoffset="0"
                        />
                        <circle
                          className="dataset-overview-ring__arc dataset-overview-ring__arc--nonfollowers"
                          cx="48"
                          cy="48"
                          r={reachRingMetrics.radius}
                          pathLength={100}
                          strokeDasharray={`${reachRingMetrics.nonFollowerPercentOfPath} 100`}
                          strokeDashoffset={reachRingMetrics.nonFollowerOffsetPercent}
                        />
                      </svg>
                    ) : null}
                    <div className="dataset-overview-ring__core">
                      <strong>{formatPercent(dataset.metrics?.reachNonFollowersPercent, "--")}</strong>
                      <span>non-followers</span>
                    </div>
                  </div>
                  <div className="dataset-overview-split-list">
                    <div>
                      <span className="dataset-overview-split-label">
                        <i className="dataset-overview-split-dot dataset-overview-split-dot--followers" aria-hidden="true" />
                        followers
                      </span>
                      <strong>{formatPercent(dataset.metrics?.reachFollowersPercent)}</strong>
                    </div>
                    <div>
                      <span className="dataset-overview-split-label">
                        <i className="dataset-overview-split-dot dataset-overview-split-dot--nonfollowers" aria-hidden="true" />
                        non-followers
                      </span>
                      <strong>{formatPercent(dataset.metrics?.reachNonFollowersPercent)}</strong>
                    </div>
                  </div>
                </div>
              </article>

              <article className="dataset-overview-support-card dataset-overview-support-card--snapshot">
                <span className="dataset-overview-panel-title">audience snapshot</span>
                <div className="dataset-overview-detail-list">
                  <div>
                    <span>
                      <MapPin size={14} aria-hidden="true" />
                      top city
                    </span>
                    {dataset.metrics?.topFollowerCity ? (
                      <div className="dataset-overview-inline-row">
                        <strong>{formatProperCaseLabel(dataset.metrics.topFollowerCity)}</strong>
                        <span className="dataset-overview-percent-pill">
                          {formatPercent(dataset.metrics.topFollowerCityPercent, "--")}
                        </span>
                      </div>
                    ) : (
                      <strong>not detected</strong>
                    )}
                    <div className="dataset-overview-snapshot-bar dataset-overview-snapshot-bar--city" aria-hidden="true">
                      <div
                        className="dataset-overview-snapshot-bar__fill"
                        style={{ width: `${getClampedPercent(dataset.metrics?.topFollowerCityPercent)}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <span>
                      <Globe2 size={14} aria-hidden="true" />
                      top country
                    </span>
                    {dataset.metrics?.topFollowerCountry ? (
                      <div className="dataset-overview-inline-row">
                        <strong>{formatProperCaseLabel(dataset.metrics.topFollowerCountry)}</strong>
                        <span className="dataset-overview-percent-pill">
                          {formatPercent(dataset.metrics.topFollowerCountryPercent, "--")}
                        </span>
                      </div>
                    ) : (
                      <strong>not detected</strong>
                    )}
                    <div className="dataset-overview-snapshot-bar dataset-overview-snapshot-bar--country" aria-hidden="true">
                      <div
                        className="dataset-overview-snapshot-bar__fill"
                        style={{ width: `${getClampedPercent(dataset.metrics?.topFollowerCountryPercent)}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <span>
                      <VenusAndMars size={14} aria-hidden="true" />
                      gender split
                    </span>
                    <div className="dataset-overview-snapshot-gender-row">
                      <div className="dataset-overview-snapshot-gender-ring" aria-hidden="true">
                        {genderRingMetrics ? (
                          <svg className="dataset-overview-snapshot-gender-ring__svg" viewBox="0 0 72 72" aria-hidden="true">
                            <circle className="dataset-overview-snapshot-gender-ring__track" cx="36" cy="36" r="27" />
                            <circle
                              className="dataset-overview-snapshot-gender-ring__arc dataset-overview-snapshot-gender-ring__arc--women"
                              cx="36"
                              cy="36"
                              r={genderRingMetrics.radius}
                              pathLength={100}
                              strokeDasharray={`${genderRingMetrics.primaryPercentOfPath} 100`}
                              strokeDashoffset="0"
                            />
                            <circle
                              className="dataset-overview-snapshot-gender-ring__arc dataset-overview-snapshot-gender-ring__arc--men"
                              cx="36"
                              cy="36"
                              r={genderRingMetrics.radius}
                              pathLength={100}
                              strokeDasharray={`${genderRingMetrics.secondaryPercentOfPath} 100`}
                              strokeDashoffset={genderRingMetrics.secondaryOffsetPercent}
                            />
                          </svg>
                        ) : null}
                        <div className="dataset-overview-snapshot-gender-ring__core">
                          <strong>{formatPercent(dataset.metrics?.womenFollowerPercent, "--")}</strong>
                          <span>women</span>
                        </div>
                      </div>
                      <div className="dataset-overview-snapshot-gender-legend" aria-hidden="true">
                        <div>
                          <span>
                            <i className="dataset-overview-snapshot-gender-dot dataset-overview-snapshot-gender-dot--women" />
                            women
                          </span>
                          <strong>{formatPercent(dataset.metrics?.womenFollowerPercent, "--")}</strong>
                        </div>
                        <div>
                          <span>
                            <i className="dataset-overview-snapshot-gender-dot dataset-overview-snapshot-gender-dot--men" />
                            men
                          </span>
                          <strong>{formatPercent(dataset.metrics?.menFollowerPercent, "--")}</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="dataset-overview-detail-list__section-break dataset-overview-detail-list__section-break--activity">
                    <span>
                      <CalendarDays size={14} aria-hidden="true" />
                      most active day
                    </span>
                    <div className="dataset-overview-activity-spotlight">
                      <strong>
                        {dataset.metrics?.topFollowerActivityDay || "not detected"}
                      </strong>
                      {dataset.metrics?.topFollowerActivityDay ? (
                        <small className="dataset-overview-detail-note">
                          {formatMetric(dataset.metrics.topFollowerActivityValue, "--")} follower activity
                        </small>
                      ) : null}
                    </div>
                  </div>
                </div>
              </article>

              <article className="dataset-overview-support-card dataset-overview-support-card--interaction">
                <div className="dataset-overview-support-head">
                  <span className="dataset-overview-panel-title">interaction mix</span>
                  <strong className="dataset-overview-support-value">
                    {formatMetric(
                      (dataset.metrics?.postLikes ?? 0) +
                        (dataset.metrics?.postComments ?? 0) +
                        (dataset.metrics?.postSaves ?? 0),
                    )}
                  </strong>
                </div>
                <div className="dataset-overview-interaction-list">
                  {interactionMixItems.map((item) => {
                    const Icon = item.icon;
                    const numericValue = Number(item.value);
                    const barWidth =
                      interactionMixTotal > 0 && Number.isFinite(numericValue)
                        ? `${Math.max((numericValue / interactionMixTotal) * 100, 8)}%`
                        : "0%";

                    return (
                      <div key={item.key} className={`dataset-overview-interaction-item dataset-overview-interaction-item--${item.key}`}>
                        <div className="dataset-overview-interaction-item__head">
                          <span>
                            <Icon size={14} aria-hidden="true" />
                            {item.label}
                          </span>
                          <strong>{formatMetric(item.value)}</strong>
                        </div>
                        <div className="dataset-overview-interaction-item__track" aria-hidden="true">
                          <div className="dataset-overview-interaction-item__fill" style={{ width: barWidth }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </article>

              <article className="dataset-overview-support-card dataset-overview-support-card--details">
                <span className="dataset-overview-panel-title">dataset details</span>
                <div className="dataset-overview-detail-list">
                  <div>
                    <span>overview window</span>
                    <strong>{formatOverviewWindow(dataset.scope)}</strong>
                  </div>
                  <div>
                    <span>export type</span>
                    <strong>{getExportRangeLabel(dataset.scope)}</strong>
                  </div>
                  <div>
                    <span>import source</span>
                    <strong>{dataset.importReview.sourceLabel}</strong>
                  </div>
                  <div>
                    <span>media quality</span>
                    <strong>{dataset.scope?.exportRequestMediaQuality || "not detected"}</strong>
                  </div>
                </div>
              </article>
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
                  <span>followers</span>
                  <strong>{formatMetric(dataset.metrics?.followerCount ?? null, "0")}</strong>
                </div>
                <div>
                  <span>following</span>
                  <strong>{formatMetric(dataset.metrics?.followingCount ?? null, "0")}</strong>
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
                        {(["newest", "oldest", "a-z"] as const).map((option) => (
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
                const dateRangeLabel =
                  (item.scope ? formatOverviewWindow(item.scope) : "") || item.importReview.sourceLabel;

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
            className="dataset-modal dataset-modal--tools"
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
                  available now and coming soon in your workspace.
                </p>
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
              {workspaceModalTools.map((tool) => {
                const Icon = getSoftLaunchToolIcon(tool.id);
                const badgeClassName = tool.availability === "available now" ? "is-live" : "is-soon";
                const href =
                  tool.id === "not-following-back"
                    ? `/app/datasets/${dataset.id}/tools/not-following-back`
                    : null;

                return href ? (
                  <Link
                    key={tool.id}
                    href={href}
                    className={`dataset-tool-card ${badgeClassName}`.trim()}
                    onClick={() => setIsToolsModalOpen(false)}
                  >
                    <div className="dataset-tool-card__head">
                      <span className="dataset-tool-card__icon" aria-hidden="true">
                        <Icon size={17} strokeWidth={1.9} />
                      </span>
                      <span className={`dataset-tool-card__badge ${badgeClassName}`.trim()}>
                        {tool.availability}
                      </span>
                    </div>
                    <strong className="dataset-tool-card__title">{tool.title}</strong>
                    <p className="dataset-tool-card__note">{tool.workspaceDescription}</p>
                    <div className="dataset-tool-card__footer">
                      <span>{tool.workspaceHelper}</span>
                      <span className="dataset-tool-card__action">{tool.workspaceAction}</span>
                    </div>
                  </Link>
                ) : (
                  <div key={tool.id} className={`dataset-tool-card ${badgeClassName}`.trim()}>
                    <div className="dataset-tool-card__head">
                      <span className="dataset-tool-card__icon" aria-hidden="true">
                        <Icon size={17} strokeWidth={1.9} />
                      </span>
                      <span className={`dataset-tool-card__badge ${badgeClassName}`.trim()}>
                        {tool.availability}
                      </span>
                    </div>
                    <strong className="dataset-tool-card__title">{tool.title}</strong>
                    <p className="dataset-tool-card__note">{tool.workspaceDescription}</p>
                    <div className="dataset-tool-card__footer">
                      <span>{tool.workspaceHelper}</span>
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
