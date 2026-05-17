"use client";

import {
  Check,
  ChevronDown,
  CircleAlert,
  FolderKanban,
  Info,
  LayoutDashboard,
  Pencil,
  Plus,
  Search,
  SearchX,
  Settings,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import Link from "next/link";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
} from "react";
import { createPortal } from "react-dom";
import {
  DATASET_NAME_MAX_LENGTH,
  deleteLocalDataset,
  getActiveDatasetServerSnapshot,
  getLocalDatasetsServerSnapshot,
  hasReachedLocalDatasetLimit,
  LOCAL_DATASET_LIMIT_MESSAGE,
  LOCAL_DATASETS_STORAGE_KEY,
  MAX_LOCAL_DATASETS,
  readActiveDatasetId,
  readLocalDatasets,
  subscribeToActiveDataset,
  subscribeToLocalDatasets,
  type LocalDatasetRecord,
  updateLocalDatasetName,
  writeActiveDatasetId,
} from "@/lib/instagram/local-datasets";

type DatasetStorageSortOrder = "latest" | "earliest" | "a-z";
type DatasetStorageIssue = "corrupt" | "unavailable" | "";

const STORAGE_PROBE_KEY = "instalyzer_storage_probe";
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

function formatDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getDatasetHandle(dataset: LocalDatasetRecord) {
  const username = dataset.profile?.username?.trim();
  return username ? `@${username}` : "account not detected";
}

function getDatasetWindow(dataset: LocalDatasetRecord) {
  const insightWindow = dataset.scope?.insightDateRangeLabel?.trim();
  if (insightWindow) return insightWindow.replace(/\s+-\s+/, " - ");

  if (dataset.scope?.exportRequestRange === "all_time") return "all-time export";
  if (dataset.scope?.exportRequestRange === "limited") return "limited export";
  return "window not detected";
}

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

function getPositiveTimestamp(value: unknown) {
  const timestamp = Number(value);
  return Number.isFinite(timestamp) && timestamp > 0 ? timestamp : null;
}

function formatTimestampSpan(startTimestamp: number | null, endTimestamp: number | null) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const startDate = startTimestamp ? formatter.format(new Date(startTimestamp * 1000)) : "";
  const endDate = endTimestamp ? formatter.format(new Date(endTimestamp * 1000)) : "";

  if (startDate && endDate) {
    return startDate === endDate ? startDate : `${startDate} - ${endDate}`;
  }

  if (startDate) return `since ${startDate}`;
  if (endDate) return `through ${endDate}`;
  return "";
}

function getDatasetTimeline(dataset: LocalDatasetRecord) {
  const followerTimestamps =
    dataset.records?.followers
      ?.map((record) => getPositiveTimestamp(record.timestamp))
      .filter((timestamp): timestamp is number => timestamp !== null) || [];
  const followingTimestamps =
    dataset.records?.following
      ?.map((record) => getPositiveTimestamp(record.timestamp))
      .filter((timestamp): timestamp is number => timestamp !== null) || [];
  const startCandidates = [
    getPositiveTimestamp(dataset.scope?.accountTimelineStartTimestamp),
    getPositiveTimestamp(dataset.profile?.profilePhotoCreatedAt),
    ...followerTimestamps,
    ...followingTimestamps,
  ].filter((timestamp): timestamp is number => timestamp !== null);
  const endCandidates = [
    getPositiveTimestamp(dataset.scope?.accountTimelineEndTimestamp),
    getPositiveTimestamp(dataset.scope?.exportRequestEndTimestamp),
    getPositiveTimestamp(dataset.profile?.profilePhotoCreatedAt),
    ...followerTimestamps,
    ...followingTimestamps,
  ].filter((timestamp): timestamp is number => timestamp !== null);
  const startTimestamp = startCandidates.length ? Math.min(...startCandidates) : null;
  const endTimestamp = endCandidates.length ? Math.max(...endCandidates) : null;
  const value = formatTimestampSpan(startTimestamp, endTimestamp);

  if (!value) return null;

  return {
    label: dataset.scope?.accountTimelineStartSource === "registration" ? "account timeline" : "archive coverage",
    value,
  };
}

function getExportRangeLabel(scope?: {
  exportRequestRange?: "all_time" | "limited" | "unknown";
}) {
  if (scope?.exportRequestRange === "all_time") return "all-time export";
  if (scope?.exportRequestRange === "limited") return "limited export";
  return "export imported";
}

function formatExportFormat(scope?: {
  exportRequestMetadataDetected?: boolean;
  exportRequestFormat?: string;
}) {
  const exportFormat = String(scope?.exportRequestFormat || "").trim();
  if (exportFormat) return exportFormat.toLowerCase();
  if (scope?.exportRequestMetadataDetected === false) return "not included in this export";
  return "not available";
}

function getRelationshipToolsStatus(scope?: {
  notFollowingBackEligible?: boolean;
  exportRequestRange?: "all_time" | "limited" | "unknown";
}) {
  if (scope?.notFollowingBackEligible) return "ready";
  if (scope?.exportRequestRange === "limited") return "limited export";
  return "not ready";
}

function getInsightsStatus(input?: {
  scope?: {
    insightDateRangeLabel?: string;
  };
  metrics?: {
    followerTotalFromInsights?: number | null;
    accountsReached?: number | null;
    impressions?: number | null;
    profileVisits?: number | null;
    externalLinkTaps?: number | null;
    contentInteractions?: number | null;
    accountsEngaged?: number | null;
  };
}) {
  const hasInsightSignal =
    Boolean(String(input?.scope?.insightDateRangeLabel || "").trim()) ||
    [
      input?.metrics?.followerTotalFromInsights,
      input?.metrics?.accountsReached,
      input?.metrics?.impressions,
      input?.metrics?.profileVisits,
      input?.metrics?.externalLinkTaps,
      input?.metrics?.contentInteractions,
      input?.metrics?.accountsEngaged,
    ].some((value) => Number.isFinite(value));

  return hasInsightSignal ? "detected" : "not detected";
}

function getSearchText(dataset: LocalDatasetRecord) {
  return [
    dataset.name,
    dataset.profile?.username,
    dataset.profile?.displayName,
    dataset.importReview.sourceLabel,
    dataset.importReview.categoryLabels.join(" "),
    getDatasetWindow(dataset),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function detectDatasetStorageIssue(): DatasetStorageIssue {
  if (typeof window === "undefined") return "";

  try {
    window.localStorage.setItem(STORAGE_PROBE_KEY, "1");
    window.localStorage.removeItem(STORAGE_PROBE_KEY);
  } catch {
    return "unavailable";
  }

  let raw: string | null = null;

  try {
    raw = window.localStorage.getItem(LOCAL_DATASETS_STORAGE_KEY);
  } catch {
    return "unavailable";
  }

  if (!raw) return "";

  try {
    return Array.isArray(JSON.parse(raw) as unknown) ? "" : "corrupt";
  } catch {
    return "corrupt";
  }
}

function buildStorageFloatingPanelStyle(
  anchor: HTMLButtonElement | null,
  panel: "menu" | "rename",
): CSSProperties | null {
  if (!anchor || typeof window === "undefined") return null;

  const anchorRect = anchor.getBoundingClientRect();
  const width = panel === "menu" ? 86 : Math.min(276, window.innerWidth - 32);
  const height = panel === "menu" ? 46 : 76;
  const gap = panel === "menu" ? 6 : 10;
  const viewportPadding = 16;

  let left = panel === "menu" ? anchorRect.right + gap : anchorRect.left - width - gap;
  let top = anchorRect.top + anchorRect.height / 2 - height / 2;

  if (panel === "menu" && left > window.innerWidth - width - viewportPadding) {
    left = anchorRect.left - width - gap;
  }

  if (panel === "rename" && left < viewportPadding) {
    left = anchorRect.right + gap;
  }

  left = Math.max(viewportPadding, Math.min(left, window.innerWidth - width - viewportPadding));
  top = Math.max(viewportPadding, Math.min(top, window.innerHeight - height - viewportPadding));

  return {
    position: "fixed",
    left,
    top,
    width,
    zIndex: 60,
  };
}

export function DatasetsIndexLoadingState() {
  return (
    <section
      className="dataset-index dataset-storage dataset-storage--loading"
      aria-busy="true"
      aria-labelledby="dataset-index-loading-title"
    >
      <div className="dataset-storage__header">
        <div className="dataset-storage__headline">
          <p className="section-kicker">storage</p>
          <h1 id="dataset-index-loading-title">saved exports</h1>
          <p className="dataset-index__description">checking your saved exports.</p>
        </div>
      </div>

      <div className="dataset-storage__toolbar dataset-storage__toolbar--loading" aria-hidden="true">
        <div className="dataset-storage__search dataset-storage__search--skeleton">
          <Search size={18} aria-hidden="true" />
          <span className="dataset-skeleton-line dataset-storage-skeleton dataset-storage-skeleton--search" />
        </div>

        <div className="dataset-storage__sort dataset-storage__sort--skeleton">
          <span className="dataset-skeleton-line dataset-storage-skeleton dataset-storage-skeleton--sort-label" />
          <div className="dataset-storage__sort-control">
            <span className="dataset-skeleton-line dataset-storage-skeleton dataset-storage-skeleton--sort" />
            <ChevronDown size={18} aria-hidden="true" />
          </div>
        </div>

        <span className="hero-btn hero-btn-primary dataset-storage__import-button dataset-storage__import-button--skeleton">
          <Plus size={22} aria-hidden="true" />
        </span>
      </div>

      <div className="dataset-storage__loading-panel" aria-hidden="true">
        <div className="dataset-storage__loading-panel-head">
          <span className="dataset-skeleton-line dataset-storage-skeleton dataset-storage-skeleton--panel-title" />
          <span className="dataset-skeleton-line dataset-storage-skeleton dataset-storage-skeleton--panel-chip" />
        </div>
        <span className="dataset-skeleton-line dataset-storage-skeleton dataset-storage-skeleton--panel-main" />
        <span className="dataset-skeleton-line dataset-storage-skeleton dataset-storage-skeleton--panel-sub" />
      </div>
    </section>
  );
}

function DatasetsIndexEmptyState() {
  return (
    <section className="dataset-index dataset-index--empty dataset-storage-state" aria-labelledby="dataset-index-title">
      <div className="dataset-index__hero">
        <span className="route-badge route-badge--workspace">storage</span>
        <p className="route-path">/app/datasets</p>
        <h1 id="dataset-index-title">saved exports</h1>
        <p className="dataset-index__description">
          Saved Instagram exports will appear here after you import your first archive.
        </p>
        <div className="dataset-storage__summary dataset-storage__summary--empty" aria-label={`0 / ${MAX_LOCAL_DATASETS} exports used`}>
          <span>storage</span>
          <strong>0 / {MAX_LOCAL_DATASETS}</strong>
        </div>
      </div>

      <article className="dataset-card dataset-card--empty dataset-index-empty-card">
        <div className="dataset-card__head">
          <div>
            <p className="dataset-card__eyebrow">no saved exports</p>
            <h2>import your first export</h2>
          </div>
          <span className="dataset-index-empty-card__icon" aria-hidden="true">
            <FolderKanban size={20} strokeWidth={1.85} />
          </span>
        </div>

        <p className="dataset-card__copy">
          Upload an official Instagram export once, then return here to reopen the workspace,
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
          <Link href="/app/datasets/new?entry=datasets-index&returnTo=storage" className="hero-btn hero-btn-primary">
            <Upload size={16} aria-hidden="true" />
            import export
          </Link>
          <Link href="/help" className="hero-btn hero-btn-secondary">
            view export guide
          </Link>
        </div>
      </article>
    </section>
  );
}

function DatasetStorageIssueState({ issue }: { issue: Exclude<DatasetStorageIssue, ""> }) {
  const copy =
    issue === "corrupt"
      ? {
          eyebrow: "storage issue",
          title: "saved exports need attention",
          body: "we couldn't read the saved export data in this browser. reload first, and contact support before clearing browser data.",
        }
      : {
          eyebrow: "storage unavailable",
          title: "saved exports could not load",
          body: "your browser is blocking local storage right now. enable browser storage, then reload this page.",
        };

  return (
    <section
      className="dataset-index dataset-index--empty dataset-storage-state dataset-storage-state--issue"
      aria-labelledby="dataset-storage-issue-title"
    >
      <div className="dataset-storage__header">
        <div className="dataset-storage__headline">
          <p className="section-kicker">storage</p>
          <h1 id="dataset-storage-issue-title">saved exports</h1>
          <p className="dataset-index__description">manage imported instagram exports and reopen any workspace.</p>
        </div>
      </div>

      <article className="dataset-card dataset-card--empty dataset-index-empty-card dataset-storage-state-card dataset-storage-state-card--issue">
        <div className="dataset-card__head">
          <div>
            <p className="dataset-card__eyebrow">{copy.eyebrow}</p>
            <h2>{copy.title}</h2>
          </div>
          <span className="dataset-storage-state-card__icon is-error" aria-hidden="true">
            <CircleAlert size={20} strokeWidth={1.9} />
          </span>
        </div>

        <p className="dataset-card__copy">{copy.body}</p>

        <div className="route-links dataset-index-empty-card__actions">
          <button type="button" className="hero-btn hero-btn-primary" onClick={() => window.location.reload()}>
            reload
          </button>
          <Link href="/contact" className="hero-btn hero-btn-secondary">
            contact support
          </Link>
        </div>
      </article>
    </section>
  );
}

function DatasetStorageDetailsModal({
  dataset,
  onClose,
}: {
  dataset: LocalDatasetRecord;
  onClose: () => void;
}) {
  const datasetTimeline = getDatasetTimeline(dataset);

  return createPortal(
    <div
      className="dataset-modal-backdrop dataset-modal-backdrop--details"
      role="presentation"
      onClick={onClose}
    >
      <article
        className="dataset-modal dataset-modal--details"
        role="dialog"
        aria-modal="true"
        aria-labelledby="storage-dataset-details-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="dataset-modal__head">
          <div className="dataset-modal__head-copy">
            <p className="section-kicker">details</p>
            <h2 id="storage-dataset-details-title" className="dataset-modal__title dataset-user-title">
              {dataset.name}
            </h2>
            <p className="dataset-modal__copy">{getDatasetHandle(dataset)}</p>
          </div>
          <button
            type="button"
            className="dataset-modal__close"
            aria-label="close dataset details"
            onClick={onClose}
            autoFocus
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="dataset-storage-details">
          <div className="dataset-overview-details-row dataset-overview-details-row--paired">
            <div className="dataset-overview-details-cell">
              <span>imported on</span>
              <strong>{formatDate(dataset.createdAt)}</strong>
            </div>
            <div className="dataset-overview-details-cell">
              <span>export format</span>
              <strong>{formatExportFormat(dataset.scope)}</strong>
            </div>
          </div>
          <div className="dataset-overview-details-row">
            <span>overview window</span>
            <strong>{formatOverviewWindow(dataset.scope)}</strong>
          </div>
          {datasetTimeline ? (
            <div className="dataset-overview-details-row">
              <span>{datasetTimeline.label}</span>
              <strong>{datasetTimeline.value}</strong>
            </div>
          ) : null}
          <div className="dataset-overview-details-row dataset-overview-details-row--paired">
            <div className="dataset-overview-details-cell">
              <span>export type</span>
              <strong>{getExportRangeLabel(dataset.scope)}</strong>
            </div>
            <div className="dataset-overview-details-cell">
              <span>import source</span>
              <strong>{dataset.importReview.sourceLabel}</strong>
            </div>
          </div>
          <div className="dataset-overview-details-row dataset-overview-details-row--paired">
            <div className="dataset-overview-details-cell">
              <span>relationship tools</span>
              <strong>{getRelationshipToolsStatus(dataset.scope)}</strong>
            </div>
            <div className="dataset-overview-details-cell">
              <span>insights</span>
              <strong>{getInsightsStatus(dataset)}</strong>
            </div>
          </div>
        </div>
      </article>
    </div>,
    document.body,
  );
}

export function DatasetsIndexRoute() {
  const hasMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const [isHydrationSettled, setIsHydrationSettled] = useState(false);
  const [storageIssue, setStorageIssue] = useState<DatasetStorageIssue>("");
  const datasets = useSyncExternalStore(
    subscribeToLocalDatasets,
    readLocalDatasets,
    getLocalDatasetsServerSnapshot,
  );
  const activeDatasetId = useSyncExternalStore(
    subscribeToActiveDataset,
    readActiveDatasetId,
    getActiveDatasetServerSnapshot,
  );
  const [query, setQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<DatasetStorageSortOrder>("latest");
  const [openDatasetMenuId, setOpenDatasetMenuId] = useState<string | null>(null);
  const [renamingDatasetId, setRenamingDatasetId] = useState<string | null>(null);
  const [deleteConfirmDatasetId, setDeleteConfirmDatasetId] = useState<string | null>(null);
  const [detailsDatasetId, setDetailsDatasetId] = useState<string | null>(null);
  const [datasetNameDraft, setDatasetNameDraft] = useState("");
  const [floatingPanelStyle, setFloatingPanelStyle] = useState<CSSProperties | null>(null);
  const rowActionsRef = useRef<HTMLDivElement | null>(null);
  const floatingMenuRef = useRef<HTMLDivElement | null>(null);
  const floatingRenameRef = useRef<HTMLFormElement | null>(null);
  const menuTriggerRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const hasReachedDatasetLimit = hasReachedLocalDatasetLimit(datasets);
  const normalizedQuery = query.trim().toLowerCase();
  const filteredDatasets = useMemo(() => {
    const nextDatasets = normalizedQuery
      ? datasets.filter((dataset) => getSearchText(dataset).includes(normalizedQuery))
      : [...datasets];

    nextDatasets.sort((left, right) => {
      if (sortOrder === "a-z") {
        return left.name.localeCompare(right.name);
      }

      const leftCreatedAt = Number(left.createdAtMs) || 0;
      const rightCreatedAt = Number(right.createdAtMs) || 0;
      return sortOrder === "earliest" ? leftCreatedAt - rightCreatedAt : rightCreatedAt - leftCreatedAt;
    });

    return nextDatasets;
  }, [datasets, normalizedQuery, sortOrder]);
  const storageCountLabel = `${datasets.length} / ${MAX_LOCAL_DATASETS} exports used`;
  const deleteConfirmDataset = deleteConfirmDatasetId
    ? datasets.find((dataset) => dataset.id === deleteConfirmDatasetId) || null
    : null;
  const detailsDataset = detailsDatasetId
    ? datasets.find((dataset) => dataset.id === detailsDatasetId) || null
    : null;
  const isManagedDatasetNameValid = Boolean(datasetNameDraft.trim());

  useEffect(() => {
    if (!hasMounted) return undefined;

    const settleTimer = window.setTimeout(() => {
      setStorageIssue(detectDatasetStorageIssue());
      setIsHydrationSettled(true);
    }, 140);

    return () => {
      window.clearTimeout(settleTimer);
    };
  }, [hasMounted]);

  useEffect(() => {
    if (!deleteConfirmDataset && !detailsDataset) return undefined;

    document.documentElement.classList.add("modal-open");
    document.body.classList.add("modal-open");

    return () => {
      document.documentElement.classList.remove("modal-open");
      document.body.classList.remove("modal-open");
    };
  }, [deleteConfirmDataset, detailsDataset]);

  useEffect(() => {
    if (!deleteConfirmDatasetId && !detailsDatasetId && !openDatasetMenuId && !renamingDatasetId) return undefined;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;

      if (deleteConfirmDatasetId) {
        setDeleteConfirmDatasetId(null);
        return;
      }

      if (detailsDatasetId) {
        setDetailsDatasetId(null);
        return;
      }

      setOpenDatasetMenuId(null);
      setRenamingDatasetId(null);
      setFloatingPanelStyle(null);
      setDatasetNameDraft("");
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [deleteConfirmDatasetId, detailsDatasetId, openDatasetMenuId, renamingDatasetId]);

  useEffect(() => {
    if (!openDatasetMenuId && !renamingDatasetId) return undefined;

    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node;
      const isInsideFloatingPanel =
        floatingMenuRef.current?.contains(target) || floatingRenameRef.current?.contains(target);

      if (!rowActionsRef.current?.contains(target) && !isInsideFloatingPanel) {
        setOpenDatasetMenuId(null);
        setRenamingDatasetId(null);
        setFloatingPanelStyle(null);
        setDatasetNameDraft("");
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [openDatasetMenuId, renamingDatasetId]);

  function startRenamingDataset(targetId: string, currentName: string) {
    const anchor = menuTriggerRefs.current[targetId];
    setOpenDatasetMenuId(null);
    setRenamingDatasetId(targetId);
    setDatasetNameDraft(currentName);
    setFloatingPanelStyle(anchor ? buildStorageFloatingPanelStyle(anchor, "rename") : null);
  }

  function cancelRenamingDataset() {
    setRenamingDatasetId(null);
    setFloatingPanelStyle(null);
    setDatasetNameDraft("");
  }

  function saveManagedDatasetName(targetId: string) {
    const normalizedName = datasetNameDraft.trim().slice(0, DATASET_NAME_MAX_LENGTH);
    if (!normalizedName) return;

    updateLocalDatasetName(targetId, normalizedName);
    cancelRenamingDataset();
  }

  function removeManagedDataset(datasetId: string) {
    deleteLocalDataset(datasetId);
    setOpenDatasetMenuId(null);
    setRenamingDatasetId(null);
    setDeleteConfirmDatasetId(null);
    setDetailsDatasetId(null);
    setFloatingPanelStyle(null);
    setDatasetNameDraft("");
  }

  if (!hasMounted || !isHydrationSettled) {
    return <DatasetsIndexLoadingState />;
  }

  if (storageIssue) {
    return <DatasetStorageIssueState issue={storageIssue} />;
  }

  if (!datasets.length) {
    return <DatasetsIndexEmptyState />;
  }

  return (
    <>
    <section className="dataset-index dataset-storage" aria-labelledby="dataset-index-title">
      <div className="dataset-storage__header">
        <div className="dataset-storage__headline">
          <p className="section-kicker">storage</p>
          <h1 id="dataset-index-title">saved exports</h1>
          <p className="dataset-index__description">
            manage imported instagram exports and reopen any workspace.
          </p>
        </div>
      </div>

      <div className="dataset-storage__toolbar">
        <div className="dataset-storage__summary" aria-label={storageCountLabel}>
          <span>storage</span>
          <strong>{datasets.length} / {MAX_LOCAL_DATASETS}</strong>
        </div>

        <label className="dataset-storage__search">
          <Search size={18} aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="search exports"
            aria-label="search exports"
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
          />
        </label>

        <label className="dataset-storage__sort">
          <span>sort</span>
          <div className="dataset-storage__sort-control">
            <select
              value={sortOrder}
              onChange={(event) => setSortOrder(event.target.value as DatasetStorageSortOrder)}
            >
              <option value="latest">latest</option>
              <option value="earliest">earliest</option>
              <option value="a-z">a to z</option>
            </select>
            <ChevronDown size={18} aria-hidden="true" />
          </div>
        </label>

        {hasReachedDatasetLimit ? (
          <span
            className="hero-btn hero-btn-primary dataset-storage__import-button is-disabled"
            aria-disabled="true"
            aria-label={LOCAL_DATASET_LIMIT_MESSAGE}
            title={LOCAL_DATASET_LIMIT_MESSAGE}
          >
            <Plus size={22} aria-hidden="true" />
          </span>
        ) : (
          <Link
            href="/app/datasets/new?entry=datasets-index&returnTo=storage"
            className="hero-btn hero-btn-primary dataset-storage__import-button"
            aria-label="import export"
            title="import"
          >
            <Plus size={22} aria-hidden="true" />
          </Link>
        )}
      </div>

      {hasReachedDatasetLimit ? (
        <article className="dataset-storage__notice is-full" role="status">
          <span className="dataset-storage__notice-icon" aria-hidden="true">
            <CircleAlert size={18} />
          </span>
          <div>
            <strong>storage full</strong>
            <p>{LOCAL_DATASET_LIMIT_MESSAGE} delete an export to import another.</p>
          </div>
        </article>
      ) : null}

      <div className="dataset-storage__list" role="list" aria-label="Saved exports">
        <div className="dataset-storage__list-head" aria-hidden="true">
          <span>details</span>
          <span>export</span>
          <span>overview</span>
          <span>imported</span>
          <span>source</span>
          <span>status</span>
          <span>workspace</span>
          <span>manage</span>
        </div>

        {filteredDatasets.length ? (
          filteredDatasets.map((dataset) => {
            const isActiveDataset = dataset.id === activeDatasetId;
            const isMenuOpen = openDatasetMenuId === dataset.id;
            const isRenaming = renamingDatasetId === dataset.id;
            const handle = getDatasetHandle(dataset);

            return (
              <article
                key={dataset.id}
                className={`dataset-storage-row${isActiveDataset ? " is-selected" : ""}`}
                role="listitem"
              >
                <button
                  type="button"
                  className="dataset-storage-row__select"
                  onClick={() => writeActiveDatasetId(dataset.id)}
                  aria-pressed={isActiveDataset}
                  aria-label={`select ${dataset.name} workspace`}
                />

                <button
                  type="button"
                  className="route-link dataset-storage-row__details"
                  aria-label={`view details for ${dataset.name}`}
                  title="details"
                  onClick={(event) => {
                    event.stopPropagation();
                    setOpenDatasetMenuId(null);
                    setRenamingDatasetId(null);
                    setDeleteConfirmDatasetId(null);
                    setDatasetNameDraft("");
                    setFloatingPanelStyle(null);
                    setDetailsDatasetId(dataset.id);
                  }}
                >
                  <Info size={18} aria-hidden="true" />
                </button>

                <div className="dataset-storage-row__identity">
                  <h2 className="dataset-user-title">{dataset.name}</h2>
                  <span>{handle}</span>
                </div>

                <div className="dataset-storage-row__cell" data-label="overview">
                  <strong>{getDatasetWindow(dataset)}</strong>
                </div>

                <div className="dataset-storage-row__cell" data-label="imported">
                  <strong>{formatDate(dataset.createdAt)}</strong>
                </div>

                <div className="dataset-storage-row__cell" data-label="source">
                  <strong>{dataset.importReview.sourceLabel}</strong>
                </div>

                <div className="dataset-storage-row__status" data-label="status">
                  <span
                    className={`dataset-storage-status${isActiveDataset ? " is-active" : ""}`}
                    aria-label={isActiveDataset ? "selected workspace" : "saved workspace"}
                    title={isActiveDataset ? "selected" : "saved"}
                  >
                    <span aria-hidden="true" />
                  </span>
                </div>

                <Link
                  href={`/app/datasets/${dataset.id}`}
                  className="route-link dataset-storage-row__open"
                  aria-label={`open ${dataset.name} workspace`}
                  title="open workspace"
                  onClick={() => writeActiveDatasetId(dataset.id)}
                >
                  <LayoutDashboard size={18} aria-hidden="true" />
                </Link>

                <div
                  className="dataset-storage-row__actions"
                  ref={isMenuOpen || isRenaming ? rowActionsRef : undefined}
                >
                  <button
                    type="button"
                    className="route-link dataset-storage-row__manage"
                    ref={(node) => {
                      menuTriggerRefs.current[dataset.id] = node;
                    }}
                    aria-label={`manage ${dataset.name}`}
                    aria-expanded={isMenuOpen || isRenaming}
                    title="manage export"
                    onClick={(event) => {
                      event.stopPropagation();
                      const trigger = event.currentTarget;
                      setDeleteConfirmDatasetId(null);
                      setRenamingDatasetId(null);
                      setDatasetNameDraft("");
                      setOpenDatasetMenuId((currentId) => {
                        const nextId = currentId === dataset.id ? null : dataset.id;
                        setFloatingPanelStyle(nextId ? buildStorageFloatingPanelStyle(trigger, "menu") : null);
                        return nextId;
                      });
                    }}
                  >
                    <Settings size={18} aria-hidden="true" />
                  </button>

                  {isMenuOpen
                    ? createPortal(
                        <div
                          ref={floatingMenuRef}
                          className="dataset-modal__menu dataset-modal__menu--actions dataset-storage-row__menu"
                          style={floatingPanelStyle ?? undefined}
                          role="menu"
                          aria-label={`Actions for ${dataset.name}`}
                          onClick={(event) => event.stopPropagation()}
                        >
                          <button
                            type="button"
                            className="dataset-modal__menu-item"
                            role="menuitem"
                            aria-label={`edit ${dataset.name}`}
                            title="edit"
                            onClick={(event) => {
                              event.stopPropagation();
                              startRenamingDataset(dataset.id, dataset.name);
                            }}
                          >
                            <Pencil size={14} aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            className="dataset-modal__menu-item dataset-modal__menu-item--danger"
                            role="menuitem"
                            aria-label={`delete ${dataset.name}`}
                            title="delete"
                            onClick={(event) => {
                              event.stopPropagation();
                              setOpenDatasetMenuId(null);
                              setRenamingDatasetId(null);
                              setFloatingPanelStyle(null);
                              setDatasetNameDraft("");
                              setDeleteConfirmDatasetId(dataset.id);
                            }}
                          >
                            <Trash2 size={14} aria-hidden="true" />
                          </button>
                        </div>,
                        document.body,
                      )
                    : null}

                  {isRenaming
                    ? createPortal(
                        <form
                          ref={floatingRenameRef}
                          className="dataset-modal__rename-popover dataset-storage-rename-popover"
                          style={floatingPanelStyle ?? undefined}
                          onSubmit={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            saveManagedDatasetName(dataset.id);
                          }}
                          onClick={(event) => event.stopPropagation()}
                        >
                          <div className="dataset-modal__rename-row">
                            <input
                              id={`storage-rename-${dataset.id}`}
                              className="dataset-modal__rename-input"
                              value={datasetNameDraft}
                              maxLength={DATASET_NAME_MAX_LENGTH}
                              onChange={(event) => setDatasetNameDraft(event.target.value)}
                              aria-label={`rename ${dataset.name}`}
                              autoFocus
                            />
                            <div className="dataset-modal__rename-actions">
                              <button
                                type="submit"
                                className="dataset-modal__rename-icon"
                                disabled={!isManagedDatasetNameValid}
                                aria-label={`save name for ${dataset.name}`}
                                title="save"
                              >
                                <Check size={15} aria-hidden="true" />
                              </button>
                            </div>
                          </div>
                        </form>,
                        document.body,
                      )
                    : null}
                </div>
              </article>
            );
          })
        ) : (
          <article className="dataset-storage__empty-results" role="status">
            <span className="dataset-storage__empty-results-icon" aria-hidden="true">
              <SearchX size={20} />
            </span>
            <strong>no exports match that search</strong>
            <p>try a different export name, username, source, or overview.</p>
          </article>
        )}
      </div>

    </section>
    {deleteConfirmDataset
      ? createPortal(
          <div
            className="dataset-modal-backdrop dataset-modal-backdrop--confirm"
            role="presentation"
            onClick={() => setDeleteConfirmDatasetId(null)}
          >
            <div
              className="dataset-modal dataset-modal--confirm"
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="storage-delete-export-title"
              aria-describedby="storage-delete-export-copy"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="dataset-modal__confirm-copy">
                <h2 id="storage-delete-export-title">delete export?</h2>
                <p id="storage-delete-export-copy">this removes this saved export from storage.</p>
              </div>
              <div className="dataset-modal__confirm-actions">
                <button
                  type="button"
                  className="dataset-modal__confirm-button dataset-modal__confirm-button--ghost"
                  onClick={() => setDeleteConfirmDatasetId(null)}
                  autoFocus
                >
                  cancel
                </button>
                <button
                  type="button"
                  className="dataset-modal__confirm-button dataset-modal__confirm-button--danger"
                  onClick={() => removeManagedDataset(deleteConfirmDataset.id)}
                >
                  delete
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )
      : null}
    {detailsDataset ? (
      <DatasetStorageDetailsModal dataset={detailsDataset} onClose={() => setDetailsDatasetId(null)} />
    ) : null}
    </>
  );
}
