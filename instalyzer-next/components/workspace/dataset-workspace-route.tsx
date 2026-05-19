"use client";

import {
  ArrowDownUp,
  BarChart3,
  Bookmark,
  Check,
  CircleAlert,
  ChevronLeft,
  ChevronDown,
  Database,
  ExternalLink,
  FolderKanban,
  GitCompareArrows,
  Globe2,
  Heart,
  MapPin,
  MessageCircle,
  MousePointerClick,
  Pencil,
  Search,
  Settings,
  Target,
  Trash2,
  UserMinus,
  UserPlus,
  UserRoundX,
  UsersRound,
  VenusAndMars,
  Wrench,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";
import { DatasetWorkspaceEmptyState } from "@/components/workspace/dataset-workspace-empty-state";
import { NotFollowingBackLoadingState } from "@/components/workspace/not-following-back-loading-state";
import { NotFollowingBackWorkspaceView } from "@/components/workspace/not-following-back-workspace-view";
import {
  readActiveDatasetId,
  readRecentDatasetHistory,
  DATASET_NAME_MAX_LENGTH,
  deleteLocalDataset,
  getLocalDatasetsServerSnapshot,
  findLocalDataset,
  hasReachedLocalDatasetLimit,
  MAX_LOCAL_DATASETS,
  readLocalDatasets,
  subscribeToLocalDatasets,
  updateLocalDatasetName,
  writeActiveDatasetId,
} from "@/lib/instagram/local-datasets";
import { getSoftLaunchToolIcon, workspaceModalTools } from "@/lib/instagram/tool-catalog";

type DatasetWorkspaceRouteProps = {
  datasetId?: string;
  activeToolId?: "not-following-back";
};

const datasetSortOptions = [
  { value: "latest", label: "latest" },
  { value: "earliest", label: "earliest" },
  { value: "a-z", label: "a to z" },
] as const;

type DatasetSortOrder = (typeof datasetSortOptions)[number]["value"];

function formatDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatSignedMetric(value: number | null | undefined, fallback = "Not available") {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return `${number > 0 ? "+" : ""}${number.toLocaleString()}`;
}

function formatCompactPercent(value: number | null | undefined, fallback = "Not available") {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return `${number.toFixed(number % 1 === 0 ? 0 : 1)}%`;
}

function formatSignedPercent(value: number | null | undefined, fallback = "Not available") {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return `${number > 0 ? "+" : ""}${number.toFixed(number % 1 === 0 ? 0 : 1)}%`;
}

function formatPreviousPeriodDelta(value: number | null | undefined, fallback = "Not available") {
  const formatted = formatSignedPercent(value, "");
  return formatted ? `${formatted} vs previous period` : fallback;
}

function formatCompactRatio(value: number | null | undefined, fallback = "Not available") {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return `${number.toFixed(number >= 10 || number % 1 === 0 ? 0 : 1)}`;
}

function calculatePercent(numerator: number | null | undefined, denominator: number | null | undefined) {
  const top = Number(numerator);
  const base = Number(denominator);
  if (!Number.isFinite(top) || !Number.isFinite(base) || base <= 0) return null;
  return (top / base) * 100;
}

function calculateRatio(numerator: number | null | undefined, denominator: number | null | undefined) {
  const top = Number(numerator);
  const base = Number(denominator);
  if (!Number.isFinite(top) || !Number.isFinite(base) || base <= 0) return null;
  return top / base;
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

function formatCompactOverviewWindow(scope?: {
  insightDateRangeLabel?: string;
  exportRequestEndTimestamp?: number | null;
}) {
  const rangeLabel = String(scope?.insightDateRangeLabel || "").trim();
  if (!rangeLabel) return "window not detected";

  const endTimestamp = Number(scope?.exportRequestEndTimestamp);
  const match = rangeLabel.match(
    /^([A-Za-z]{3})\s+(\d{1,2})\s*-\s*([A-Za-z]{3})\s+(\d{1,2})$/,
  );

  if (!match || !Number.isFinite(endTimestamp) || endTimestamp <= 0) {
    return rangeLabel.replace(/\s+-\s+/, " - ");
  }

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
    return rangeLabel.replace(/\s+-\s+/, " - ");
  }

  const endReference = new Date(endTimestamp * 1000);
  const endYear = endReference.getFullYear();
  const startYear =
    startMonth > endMonth || (startMonth === endMonth && startDay > endDay) ? endYear - 1 : endYear;

  return `${startMonth + 1}/${startDay}/${String(startYear).slice(-2)} - ${endMonth + 1}/${endDay}/${String(endYear).slice(-2)}`;
}

function getPositiveTimestamp(value: unknown) {
  const timestamp = Number(value);
  return Number.isFinite(timestamp) && timestamp > 0 ? timestamp : null;
}

function getDatasetTimelineLabel(scope?: {
  accountTimelineStartSource?: "registration" | "archive_activity" | "unknown";
}) {
  return scope?.accountTimelineStartSource === "registration" ? "account timeline" : "archive coverage";
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

function getDatasetTimeline(dataset: NonNullable<ReturnType<typeof findLocalDataset>>) {
  const followerTimestamps = dataset.records?.followers
    ?.map((record) => getPositiveTimestamp(record.timestamp))
    .filter((timestamp): timestamp is number => timestamp !== null) || [];
  const followingTimestamps = dataset.records?.following
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
    label: getDatasetTimelineLabel(dataset.scope),
    value,
  };
}

function getDatasetExportWindowValue(dataset: NonNullable<ReturnType<typeof findLocalDataset>>) {
  if (dataset.scope?.exportRequestRange === "all_time") {
    return getDatasetTimeline(dataset)?.value || "";
  }

  if (dataset.scope?.exportRequestRange === "limited") {
    return (
      formatTimestampSpan(
        getPositiveTimestamp(dataset.scope?.exportRequestStartTimestamp),
        getPositiveTimestamp(dataset.scope?.exportRequestEndTimestamp),
      ) || formatOverviewWindow(dataset.scope)
    );
  }

  return formatOverviewWindow(dataset.scope);
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

function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setPrefersReducedMotion(mediaQuery.matches);

    updatePreference();
    mediaQuery.addEventListener("change", updatePreference);

    return () => {
      mediaQuery.removeEventListener("change", updatePreference);
    };
  }, []);

  return prefersReducedMotion;
}

type AnimatedValueProps = {
  value: number | null | undefined;
  variant?: "metric" | "signed" | "percent" | "ratio";
  fallback?: string;
  duration?: number;
  precision?: number;
  animateKey?: string | number | null;
  reducedMotion?: boolean;
};

function formatAnimatedValue(
  value: number,
  variant: NonNullable<AnimatedValueProps["variant"]>,
  precision?: number,
) {
  if (variant === "metric") {
    return Math.round(value).toLocaleString();
  }

  if (variant === "signed") {
    const rounded = Math.round(value);
    return `${rounded > 0 ? "+" : ""}${rounded.toLocaleString()}`;
  }

  if (variant === "percent") {
    const digits = typeof precision === "number" ? precision : Math.abs(value % 1) > 0 ? 1 : 0;
    return `${value.toFixed(digits)}%`;
  }

  const digits = typeof precision === "number" ? precision : Math.abs(value % 1) > 0 ? 1 : 0;
  return value.toFixed(digits);
}

function AnimatedValue({
  value,
  variant = "metric",
  fallback = "Not available",
  duration = 960,
  precision,
  animateKey,
  reducedMotion = false,
}: AnimatedValueProps) {
  const numericValue = Number(value);
  const [displayValue, setDisplayValue] = useState(() =>
    Number.isFinite(numericValue) ? (reducedMotion ? numericValue : 0) : 0,
  );

  useEffect(() => {
    if (!Number.isFinite(numericValue)) {
      return;
    }

    if (reducedMotion) {
      const frame = window.requestAnimationFrame(() => {
        setDisplayValue(numericValue);
      });

      return () => {
        window.cancelAnimationFrame(frame);
      };
    }

    let frame = 0;
    const startValue = 0;
    const startedAt = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - startedAt) / duration, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(startValue + (numericValue - startValue) * easedProgress);

      if (progress < 1) {
        frame = window.requestAnimationFrame(tick);
      }
    };

    frame = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [animateKey, duration, numericValue, reducedMotion]);

  if (!Number.isFinite(numericValue)) {
    return <>{fallback}</>;
  }

  return <>{formatAnimatedValue(displayValue, variant, precision)}</>;
}

export function WorkspaceLoadingState() {
  return (
    <section
      className="dataset-workspace dataset-workspace--loading-balanced"
      aria-busy="true"
      aria-label="Loading workspace"
    >
      <div className="dataset-workspace__grid dataset-workspace__grid--static">
        <aside className="dataset-side-panel dataset-side-panel--left dataset-side-panel--loading dataset-side-panel--loading-balanced">
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

            <div className="dataset-side-panel__divider" aria-hidden="true" />

            <div className="hero-btn hero-btn-secondary dataset-side-panel__action dataset-side-panel__action--loading">
              <FolderKanban size={16} aria-hidden="true" />
              <span>manage datasets</span>
            </div>
          </div>
        </aside>

        <article className="dataset-workspace__surface dataset-workspace__surface--loading dataset-workspace__surface--loading-balanced">
          <div className="dataset-overview-head dataset-dashboard-section dataset-dashboard-section--header">
            <div>
              <p className="section-kicker">dataset overview</p>
              <h1 className="dataset-overview-title">opening workspace</h1>
              <p className="dataset-overview-copy dataset-overview-copy--inline">
                loading your saved dataset.
              </p>
            </div>
            <div className="dataset-overview-meta dataset-overview-meta--loading">
              <span className="dataset-meta-label">status</span>
              <span className="dataset-skeleton-line dataset-skeleton-line--meta" aria-hidden="true" />
            </div>
          </div>

          <div className="dataset-overview-body" aria-hidden="true">
            <div className="dataset-profile-band dataset-profile-band--loading dataset-profile-band--loading-balanced">
              <div className="dataset-profile-avatar-shell">
                <div className="dataset-profile-avatar dataset-profile-avatar--loading" />
              </div>

              <div className="dataset-profile-copy">
                <span className="dataset-skeleton-line dataset-skeleton-line--handle" />
                <span className="dataset-skeleton-line dataset-skeleton-line--name" />
                <span className="dataset-skeleton-line dataset-skeleton-line--meta" />
              </div>
            </div>

            <div className="dataset-overview-grid dataset-overview-grid--loading-balanced">
              {["followers", "reach", "interactions"].map((label) => (
                <article key={label} className="dataset-overview-card dataset-overview-card--loading">
                  <span className="dataset-meta-label">{label}</span>
                  <span className="dataset-skeleton-line dataset-skeleton-line--card-value" />
                </article>
              ))}
            </div>
          </div>
        </article>

        <aside className="dataset-side-panel dataset-side-panel--right dataset-side-panel--loading dataset-side-panel--loading-balanced">
          <div className="dataset-side-panel__head">
            <p className="section-kicker">workspace</p>
          </div>

          <div className="dataset-side-panel__body">
            <div className="workspace-tool-pill workspace-tool-pill--featured">
              <span className="workspace-tool-icon" aria-hidden="true">
                <UserRoundX size={16} strokeWidth={1.9} />
              </span>
              <span className="workspace-tool-copy">
                <span className="dataset-skeleton-line dataset-skeleton-line--tool" aria-hidden="true" />
              </span>
            </div>

            <article className="dataset-workspace__support-card dataset-workspace__support-card--loading-balanced">
              <p className="dataset-meta-label">relationship signals</p>
              <div className="dataset-card__metrics dataset-card__metrics--compact">
                {["followers", "following"].map((label) => (
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

export function DatasetWorkspaceRoute({ datasetId, activeToolId }: DatasetWorkspaceRouteProps) {
  const router = useRouter();
  const isWorkspaceHome = !datasetId;
  const isNotFollowingBackView = activeToolId === "not-following-back";
  const [isDatasetsModalOpen, setIsDatasetsModalOpen] = useState(false);
  const [isToolsModalOpen, setIsToolsModalOpen] = useState(false);
  const [openDatasetMenuId, setOpenDatasetMenuId] = useState<string | null>(null);
  const [renamingDatasetId, setRenamingDatasetId] = useState<string | null>(null);
  const [deleteConfirmDatasetId, setDeleteConfirmDatasetId] = useState<string | null>(null);
  const [datasetNameDraft, setDatasetNameDraft] = useState("");
  const [datasetSortOrder, setDatasetSortOrder] = useState<DatasetSortOrder>("latest");
  const [isHydrationSettled, setIsHydrationSettled] = useState(false);
  const [notFollowingBackStorageError, setNotFollowingBackStorageError] = useState("");
  const [activeOverviewCardKey, setActiveOverviewCardKey] = useState("views");
  const [isOverviewDetailOpen, setIsOverviewDetailOpen] = useState(false);
  const [floatingPanelStyle, setFloatingPanelStyle] = useState<{
    position: "fixed";
    left: number;
    top: number;
    width: number;
    zIndex: number;
  } | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const rowActionsRef = useRef<HTMLDivElement | null>(null);
  const floatingMenuRef = useRef<HTMLDivElement | null>(null);
  const floatingRenameRef = useRef<HTMLFormElement | null>(null);
  const menuTriggerRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const overviewFocusRef = useRef<HTMLDivElement | null>(null);
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
  const prefersReducedMotion = usePrefersReducedMotion();
  const activeDatasetId = hasMounted ? readActiveDatasetId() : null;
  const dataset = datasetId
    ? datasets.find((item) => item.id === datasetId) || findLocalDataset(datasetId)
    : datasets.find((item) => item.id === activeDatasetId) || datasets[0] || null;
  const motionKey = dataset?.id || "dataset-workspace";

  useEffect(() => {
    setActiveOverviewCardKey("views");
    setIsOverviewDetailOpen(false);
  }, [dataset?.id]);

  function openOverviewDetail(cardKey: string) {
    setActiveOverviewCardKey(cardKey);
    setIsOverviewDetailOpen(true);
    window.requestAnimationFrame(() => {
      overviewFocusRef.current?.scrollIntoView({
        behavior: prefersReducedMotion ? "auto" : "smooth",
        block: "start",
      });
    });
  }

  const datasetUsername = dataset?.profile?.username?.trim().toLowerCase() || "";
  const previousComparableDataset = datasetUsername
    ? datasets
        .filter(
          (item) =>
            item.id !== dataset?.id &&
            item.profile?.username?.trim().toLowerCase() === datasetUsername &&
            item.createdAtMs < (dataset?.createdAtMs ?? Number.POSITIVE_INFINITY),
        )
        .sort((a, b) => b.createdAtMs - a.createdAtMs)[0] || null
    : null;
  const accountsReached = dataset?.metrics?.accountsReached ?? null;
  const profileVisits = dataset?.metrics?.profileVisits ?? null;
  const externalLinkTaps = dataset?.metrics?.externalLinkTaps ?? null;
  const contentInteractions = dataset?.metrics?.contentInteractions ?? null;
  const accountsEngaged = dataset?.metrics?.accountsEngaged ?? null;
  const impressions = dataset?.metrics?.impressions ?? null;
  const previousAccountsReached = previousComparableDataset?.metrics?.accountsReached ?? null;
  const accountsReachedDelta =
    typeof accountsReached === "number" &&
    typeof previousAccountsReached === "number" &&
    previousAccountsReached > 0
      ? ((accountsReached - previousAccountsReached) / previousAccountsReached) * 100
      : null;
  const profileActivityTotal =
    typeof profileVisits === "number" || typeof externalLinkTaps === "number"
      ? (profileVisits ?? 0) + (externalLinkTaps ?? 0)
      : null;
  const reachShareOfImpressions = calculatePercent(accountsReached, impressions);
  const visitShareOfReach = calculatePercent(profileVisits, accountsReached);
  const linkShareOfVisits = calculatePercent(externalLinkTaps, profileVisits);
  const engagedShareOfReach = calculatePercent(accountsEngaged, accountsReached);
  const interactionsPerEngagedAccount = calculateRatio(contentInteractions, accountsEngaged);
  const impressionsPerAccount = calculateRatio(impressions, accountsReached);
  const overviewKpiCards = [
    {
      key: "views",
      label: "views",
      value: impressions,
      Icon: BarChart3,
      support:
        typeof dataset?.metrics?.impressionsDeltaPercent === "number"
          ? formatPreviousPeriodDelta(dataset.metrics.impressionsDeltaPercent)
          : impressionsPerAccount !== null
            ? `${formatCompactRatio(impressionsPerAccount)} views per reached account`
            : "views story unavailable",
    },
    {
      key: "interactions",
      label: "interactions",
      value: contentInteractions,
      Icon: Heart,
      support:
        typeof accountsEngaged === "number"
          ? `${accountsEngaged.toLocaleString()} accounts engaged`
          : typeof dataset?.metrics?.contentInteractionsDeltaPercent === "number"
            ? formatPreviousPeriodDelta(dataset.metrics.contentInteractionsDeltaPercent)
            : "content response unavailable",
    },
    {
      key: "followers",
      label: "followers",
      value: dataset?.metrics?.followerTotalFromInsights ?? dataset?.metrics?.followerCount ?? null,
      Icon: UsersRound,
      support: (() => {
        if (typeof dataset?.metrics?.netFollowersInRange === "number") {
          return `${formatSignedMetric(dataset.metrics.netFollowersInRange)} net followers`;
        }
        if (typeof dataset?.metrics?.followsInRange === "number") {
          return `${dataset.metrics.followsInRange.toLocaleString()} follows in range`;
        }
        return "audience growth unavailable";
      })(),
    },
  ];
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
  const activeOverviewCard =
    overviewKpiCards.find((card) => card.key === activeOverviewCardKey) || overviewKpiCards[0];
  const viewsAudienceRows = [
    {
      key: "followers",
      label: "followers",
      value: dataset?.metrics?.reachFollowersPercent ?? null,
      className: "is-followers",
    },
    {
      key: "nonfollowers",
      label: "non-followers",
      value: dataset?.metrics?.reachNonFollowersPercent ?? null,
      className: "is-nonfollowers",
    },
  ];
  const viewsDeltaLabel =
    typeof dataset?.metrics?.impressionsDeltaPercent === "number"
      ? formatPreviousPeriodDelta(dataset.metrics.impressionsDeltaPercent)
      : impressionsPerAccount !== null
        ? `${formatCompactRatio(impressionsPerAccount)} views per reached account`
        : "exported as impressions";
  const viewsActivityRows = [
    {
      key: "accounts-reached",
      label: "accounts reached",
      value: accountsReached,
      detail:
        accountsReachedDelta !== null
          ? `${formatSignedPercent(accountsReachedDelta)} vs previous export`
          : typeof dataset?.metrics?.accountsReachedDeltaPercent === "number"
            ? formatPreviousPeriodDelta(dataset.metrics.accountsReachedDeltaPercent)
            : reachShareOfImpressions !== null
              ? `${formatCompactPercent(reachShareOfImpressions)} unique share`
              : "reach comparison unavailable",
      Icon: Target,
    },
    {
      key: "profile-visits",
      label: "profile visits",
      value: profileVisits,
      detail:
        typeof dataset?.metrics?.profileVisitsDeltaPercent === "number"
          ? formatPreviousPeriodDelta(dataset.metrics.profileVisitsDeltaPercent)
          : visitShareOfReach !== null
            ? `${formatCompactPercent(visitShareOfReach)} of reached accounts`
            : "visit rate unavailable",
      Icon: Search,
    },
    {
      key: "external-link-taps",
      label: "external link taps",
      value: externalLinkTaps,
      detail:
        typeof dataset?.metrics?.externalLinkTapsDeltaPercent === "number"
          ? formatPreviousPeriodDelta(dataset.metrics.externalLinkTapsDeltaPercent)
          : linkShareOfVisits !== null
            ? `${formatCompactPercent(linkShareOfVisits)} of profile visits`
            : "tap conversion unavailable",
      Icon: MousePointerClick,
    },
  ];
  const followingShareOfFollowers = calculatePercent(
    dataset?.metrics?.followingCount,
    dataset?.metrics?.followerCount,
  );
  const mutualShareOfFollowing = calculatePercent(dataset?.metrics?.mutualCount, dataset?.metrics?.followingCount);
  const overviewDetailPanels = {
    views: {
      title: "views detail",
      subtitle: "total views, reached accounts, and profile action",
      value: impressions,
      Icon: BarChart3,
      insight:
        impressionsPerAccount !== null
          ? `${formatCompactRatio(impressionsPerAccount)} views per reached account`
          : "views need both impression and reach data",
      bars: [
        {
          key: "followers",
          label: "followers",
          display: formatCompactPercent(dataset?.metrics?.reachFollowersPercent),
          percent: getClampedPercent(dataset?.metrics?.reachFollowersPercent),
        },
        {
          key: "nonfollowers",
          label: "non-followers",
          display: formatCompactPercent(dataset?.metrics?.reachNonFollowersPercent),
          percent: getClampedPercent(dataset?.metrics?.reachNonFollowersPercent),
        },
      ],
      stats: [
        { label: "views", value: impressions, variant: "metric" as const },
        { label: "accounts reached", value: accountsReached, variant: "metric" as const },
        { label: "profile activity", value: profileActivityTotal, variant: "metric" as const },
      ],
    },
    interactions: {
      title: "interaction detail",
      subtitle: "how the export breaks down content response",
      value: contentInteractions,
      Icon: Heart,
      insight:
        engagedShareOfReach !== null
          ? `${formatCompactPercent(engagedShareOfReach)} of reached accounts engaged`
          : typeof dataset?.metrics?.engagedFollowersPercent === "number" ||
              typeof dataset?.metrics?.engagedNonFollowersPercent === "number"
            ? `${formatCompactPercent(dataset.metrics.engagedFollowersPercent)} from followers, ${formatCompactPercent(dataset.metrics.engagedNonFollowersPercent)} from non-followers`
            : typeof dataset?.metrics?.postLikes === "number" ||
                typeof dataset?.metrics?.postComments === "number" ||
                typeof dataset?.metrics?.postSaves === "number"
              ? "post likes, comments, and saves are available for this export"
              : "post interaction mix was not detected in this export",
      bars: interactionMixItems.map((item) => ({
        key: item.key,
        label: item.label,
        display: typeof item.value === "number" ? item.value.toLocaleString() : "Not available",
        percent:
          interactionMixTotal > 0 && typeof item.value === "number"
            ? getClampedPercent((item.value / interactionMixTotal) * 100)
            : 0,
      })),
      stats: [
        { label: "content interactions", value: contentInteractions, variant: "metric" as const },
        { label: "accounts engaged", value: accountsEngaged, variant: "metric" as const },
        { label: "engaged share", value: engagedShareOfReach, variant: "percent" as const },
        { label: "per engaged account", value: interactionsPerEngagedAccount, variant: "ratio" as const },
      ],
    },
    followers: {
      title: "follower detail",
      subtitle: "audience size, following ratio, and mutual context",
      value: dataset?.metrics?.followerTotalFromInsights ?? dataset?.metrics?.followerCount ?? null,
      Icon: UsersRound,
      insight:
        typeof dataset?.metrics?.netFollowersInRange === "number"
          ? `${formatSignedMetric(dataset.metrics.netFollowersInRange)} net followers during the export range`
          : "follower growth data was not detected in this export",
      bars: [
        {
          key: "following",
          label: "following vs followers",
          display: formatCompactPercent(followingShareOfFollowers),
          percent: getClampedPercent(followingShareOfFollowers),
        },
        {
          key: "mutuals",
          label: "mutuals from following",
          display: formatCompactPercent(mutualShareOfFollowing),
          percent: getClampedPercent(mutualShareOfFollowing),
        },
      ],
      stats: [
        { label: "followers", value: dataset?.metrics?.followerCount, variant: "metric" as const },
        { label: "following", value: dataset?.metrics?.followingCount, variant: "metric" as const },
        { label: "mutuals", value: dataset?.metrics?.mutualCount, variant: "metric" as const },
      ],
    },
  };
  const activeOverviewPanel =
    overviewDetailPanels[activeOverviewCard.key as keyof typeof overviewDetailPanels] ||
    overviewDetailPanels.views;
  const ActiveOverviewPanelIcon = activeOverviewPanel.Icon;
  const shouldUseCompositionBars = activeOverviewCard.key === "interactions";
  const isViewsDetailActive = activeOverviewCard.key === "views";
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
  const followerCityBreakdown =
    dataset?.metrics && Array.isArray(dataset.metrics.followerCityBreakdown) && dataset.metrics.followerCityBreakdown.length
      ? dataset.metrics.followerCityBreakdown
      : dataset?.metrics?.topFollowerCity
        ? [
            {
              label: dataset.metrics.topFollowerCity,
              percent: dataset.metrics.topFollowerCityPercent,
            },
          ]
        : [];
  const followerCountryBreakdown =
    dataset?.metrics && Array.isArray(dataset.metrics.followerCountryBreakdown) && dataset.metrics.followerCountryBreakdown.length
      ? dataset.metrics.followerCountryBreakdown
      : dataset?.metrics?.topFollowerCountry
        ? [
            {
              label: dataset.metrics.topFollowerCountry,
              percent: dataset.metrics.topFollowerCountryPercent,
            },
          ]
        : [];
  const followerAgeBreakdownAll =
    dataset?.metrics && Array.isArray(dataset.metrics.followerAgeBreakdownAll)
      ? dataset.metrics.followerAgeBreakdownAll
      : [];
  const relationshipSignalRows = [
    {
      key: "followers",
      label: "followers",
      value: dataset?.metrics?.followerCount ?? null,
      helper: "Audience size",
      badge:
        typeof dataset?.metrics?.followerCount === "number" && typeof dataset?.metrics?.followingCount === "number"
          ? `${formatSignedMetric(
              dataset.metrics.followerCount - dataset.metrics.followingCount,
              "0",
            )} vs following`
          : "Not available",
      accentClassName: "is-followers",
      Icon: UsersRound,
    },
    {
      key: "following",
      label: "following",
      value: dataset?.metrics?.followingCount ?? null,
      helper: "Accounts followed",
      badge:
        typeof dataset?.metrics?.followingCount === "number" &&
        typeof dataset?.metrics?.followerCount === "number" &&
        dataset.metrics.followerCount > 0
          ? `${formatCompactPercent((dataset.metrics.followingCount / dataset.metrics.followerCount) * 100)} of followers`
          : "Not available",
      accentClassName: "is-following",
      Icon: UserPlus,
    },
    {
      key: "mutuals",
      label: "mutuals",
      value: dataset?.metrics?.mutualCount ?? null,
      helper: "Follow each other",
      badge:
        typeof dataset?.metrics?.mutualCount === "number" &&
        typeof dataset?.metrics?.followingCount === "number" &&
        dataset.metrics.followingCount > 0
          ? `${formatCompactPercent((dataset.metrics.mutualCount / dataset.metrics.followingCount) * 100)} of following`
          : "Not available",
      accentClassName: "is-mutuals",
      Icon: GitCompareArrows,
    },
  ];

  function buildFloatingPanelStyle(
    anchor: HTMLButtonElement | null,
    panel: "menu" | "rename",
  ) {
    if (!anchor || typeof window === "undefined") {
      return null;
    }

    const anchorRect = anchor.getBoundingClientRect();
    const width = panel === "menu" ? 86 : Math.min(260, window.innerWidth - 72);
    const height = panel === "menu" ? 46 : 76;
    const gap = panel === "menu" ? 6 : 10;
    const viewportPadding = 16;

    let left = panel === "menu" ? anchorRect.right + gap : anchorRect.left - width - gap;
    let top = anchorRect.top + anchorRect.height / 2 - height / 2;

    if (panel === "menu" && left > window.innerWidth - width - viewportPadding) {
      left = anchorRect.left - width - gap;
    }

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
    if (!isDatasetsModalOpen || (!openDatasetMenuId && !renamingDatasetId)) return undefined;

    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node;
      const isInsideFloatingPanel =
        floatingMenuRef.current?.contains(target) || floatingRenameRef.current?.contains(target);

      if (!rowActionsRef.current?.contains(target) && !isInsideFloatingPanel) {
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
    if (!deleteConfirmDatasetId) return undefined;

    document.documentElement.classList.add("modal-open");
    document.body.classList.add("modal-open");

    return () => {
      document.documentElement.classList.remove("modal-open");
      document.body.classList.remove("modal-open");
    };
  }, [deleteConfirmDatasetId]);

  useEffect(() => {
    if (!deleteConfirmDatasetId) return undefined;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setDeleteConfirmDatasetId(null);
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [deleteConfirmDatasetId]);

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
    if (isNotFollowingBackView) {
      return <NotFollowingBackLoadingState />;
    }

    return <WorkspaceLoadingState />;
  }

  if (!dataset && datasetId) {
    return (
      <section
        className="dataset-workspace dataset-workspace--empty dataset-workspace--missing"
        aria-labelledby="dataset-missing-title"
      >
        <article className="dataset-empty-state dataset-empty-state--missing">
          <p className="section-kicker">workspace issue</p>

          <div className="dataset-empty-state__visual" aria-hidden="true">
            <div className="dataset-empty-state__visual-ring dataset-empty-state__visual-ring--outer" />
            <div className="dataset-empty-state__visual-ring dataset-empty-state__visual-ring--inner" />
            <div className="dataset-empty-state__visual-core">
              <FolderKanban strokeWidth={1.85} />
            </div>
          </div>

          <div className="dataset-empty-state__copy">
            <h1 id="dataset-missing-title" className="dataset-empty-state__title">
              dataset not found
            </h1>
            <p className="dataset-empty-state__description">
              this saved export is missing or unreadable in this browser. choose another dataset or create a new one.
            </p>
          </div>

          <div className="dataset-empty-state__actions">
            <Link href="/app/datasets" className="hero-btn hero-btn-primary dataset-empty-state__cta">
              view datasets
            </Link>
            <div className="dataset-empty-state__secondary-actions">
              <Link href="/app/datasets/new?entry=workspace-shell" className="dataset-empty-state__help">
                create dataset
              </Link>
              <Link href="/contact" className="dataset-empty-state__support">
                contact support
              </Link>
            </div>
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
    setOpenDatasetMenuId(null);
    setRenamingDatasetId(targetId);
    setDatasetNameDraft(currentName);
    setFloatingPanelStyle(anchor ? buildFloatingPanelStyle(anchor, "rename") : null);
  }

  function closeDatasetsModal() {
    setIsDatasetsModalOpen(false);
    setOpenDatasetMenuId(null);
    setRenamingDatasetId(null);
    setDeleteConfirmDatasetId(null);
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
    setOpenDatasetMenuId(null);
    setRenamingDatasetId(null);
    setDeleteConfirmDatasetId(null);
    setFloatingPanelStyle(null);
    setDatasetNameDraft("");

    if (!dataset || targetId !== dataset.id) return;

    closeDatasetsModal();
    router.push(nextDatasets[0] ? `/app/datasets/${nextDatasets[0].id}` : "/app/datasets");
  }

  const recentDatasets = dataset
    ? [dataset.id, ...readRecentDatasetHistory().filter((itemId) => itemId !== dataset.id)]
        .slice(0, 2)
        .map((itemId) => datasets.find((item) => item.id === itemId) || null)
        .filter((item): item is NonNullable<typeof item> => Boolean(item))
    : [];
  const sortedModalDatasets = [...datasets].sort((left, right) => {
    if (datasetSortOrder === "a-z") {
      return left.name.localeCompare(right.name, undefined, { sensitivity: "base" });
    }

    const dateCompare = left.createdAt.localeCompare(right.createdAt);
    return datasetSortOrder === "earliest" ? dateCompare : -dateCompare;
  });
  const deleteConfirmDataset = deleteConfirmDatasetId
    ? datasets.find((item) => item.id === deleteConfirmDatasetId) || null
    : null;
  const hasReachedDatasetLimit = hasReachedLocalDatasetLimit(datasets);
  const overviewHref = datasetId ? `/app/datasets/${dataset.id}` : "/app";
  const notFollowingBackHref = `/app/datasets/${dataset.id}/tools/not-following-back`;

  return (
    <section className="dataset-workspace dataset-workspace--hydrated" aria-labelledby="dataset-workspace-title">
      <div className="dataset-workspace__grid dataset-workspace__grid--static">
        <div className="dataset-workspace__left-stack">
          <aside className="dataset-side-panel dataset-side-panel--left dataset-dashboard-section dataset-dashboard-section--sidebar-left">
            <div className="dataset-side-panel__head">
              <p className="section-kicker">{isWorkspaceHome ? "workspace overview" : "current dataset"}</p>
              <div className="dataset-side-panel__dataset-block">
                <h2 className="tools-sidebar-title dataset-side-panel__title dataset-user-title">{dataset.name}</h2>
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
                      <Link
                        key={item.id}
                        href={`/app/datasets/${item.id}`}
                        className={`dataset-side-panel__recent-chip${isActiveDataset ? " is-active" : ""}`}
                      >
                        <span className="dataset-side-panel__recent-name-row">
                          <span className="dataset-side-panel__recent-name">{item.name}</span>
                          {isActiveDataset ? (
                            <span
                              className="dataset-side-panel__active-indicator"
                              aria-label="Active dataset"
                              title="Active dataset"
                            >
                              <span className="dataset-side-panel__active-dot" aria-hidden="true" />
                            </span>
                          ) : null}
                        </span>
                        <span className="dataset-side-panel__recent-meta">
                          {isActiveDataset ? "selected" : formatDate(item.createdAt)}
                        </span>
                      </Link>
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

          {isNotFollowingBackView && notFollowingBackStorageError ? (
            <article className="dataset-tool-storage-alert" role="alert">
              <CircleAlert size={15} strokeWidth={2.1} aria-hidden="true" />
              <div>
                <span>storage issue</span>
                <strong>{notFollowingBackStorageError}</strong>
              </div>
            </article>
          ) : null}
        </div>

        <article className="dataset-workspace__surface">
          <div className="dataset-overview-head">
            <div>
              <p className="section-kicker">
                {isNotFollowingBackView
                  ? "relationship tool"
                  : isWorkspaceHome
                    ? "workspace overview"
                    : "dataset overview"}
              </p>
              <h1
                id="dataset-workspace-title"
                className={`dataset-overview-title${
                  !isNotFollowingBackView && !isWorkspaceHome ? " dataset-user-title" : ""
                }`}
              >
                {isNotFollowingBackView ? "not following back" : dataset.name}
              </h1>
              {isNotFollowingBackView ? (
                <p className="dataset-overview-copy dataset-overview-copy--inline">
                  review flagged accounts and organize cleanup.
                </p>
              ) : null}
            </div>
            <div className="dataset-overview-meta">
              {isNotFollowingBackView ? (
                <>
                  <Link href={overviewHref} className="dataset-meta-value dataset-meta-value--link">
                    <ChevronLeft size={15} aria-hidden="true" />
                    back to overview
                  </Link>
                </>
              ) : (
                <>
                  <span className="dataset-meta-label">{isWorkspaceHome ? "latest import" : "created"}</span>
                  <span className="dataset-meta-value">{formatDate(dataset.createdAt)}</span>
                </>
              )}
            </div>
          </div>

          {isNotFollowingBackView ? (
            <NotFollowingBackWorkspaceView
              key={dataset.id}
              dataset={dataset}
              onStorageStatusChange={setNotFollowingBackStorageError}
            />
          ) : (
          <div className="dataset-overview-body">
            <div className="dataset-profile-band dataset-dashboard-section dataset-dashboard-section--profile">
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
                  <span className="dataset-profile-range__full">
                    overview window: {formatOverviewWindow(dataset.scope)}
                  </span>
                  <span className="dataset-profile-range__compact">
                    overview window: {formatCompactOverviewWindow(dataset.scope)}
                  </span>
                </p>
              </div>
            </div>

            <div ref={overviewFocusRef} className={`dataset-overview-focus${isOverviewDetailOpen ? " is-detail-open" : ""}`}>
              {isOverviewDetailOpen ? (
                <div className="dataset-overview-drill-view" key={`${motionKey}-${activeOverviewCard.key}-detail`}>
                  {isViewsDetailActive ? (
                    <article className="dataset-overview-views-panel">
                      <button
                        type="button"
                        className="dataset-meta-value dataset-meta-value--link dataset-overview-drill-back"
                        onClick={() => setIsOverviewDetailOpen(false)}
                      >
                        <ChevronLeft size={15} aria-hidden="true" />
                        back to overview
                      </button>

                      <section className="dataset-overview-views-hero" aria-label="Views detail">
                        <div className="dataset-overview-views-copy">
                          <div className="dataset-overview-drill-panel__head">
                            <i className="dataset-overview-drill-panel__icon" aria-hidden="true">
                              <BarChart3 size={18} strokeWidth={1.9} />
                            </i>
                            <div>
                              <span className="dataset-overview-panel-title">views</span>
                              <p className="dataset-overview-panel-subtitle">
                                total views, reached accounts, and profile action
                              </p>
                            </div>
                          </div>

                          <div className="dataset-overview-views-total">
                            <span>total views</span>
                            <strong>
                              <AnimatedValue
                                value={impressions}
                                variant="metric"
                                animateKey={`${motionKey}-views-total`}
                                reducedMotion={prefersReducedMotion}
                              />
                            </strong>
                            <small>{viewsDeltaLabel}</small>
                          </div>
                        </div>

                        <div className="dataset-overview-views-ring-card">
                          <div className="dataset-overview-ring dataset-overview-ring--views">
                            {reachRingMetrics ? (
                              <svg
                                className="dataset-overview-ring__svg"
                                viewBox="0 0 96 96"
                                aria-label="Views audience split"
                              >
                                <circle className="dataset-overview-ring__track" cx="48" cy="48" r="34" />
                                <circle
                                  className="dataset-overview-ring__arc dataset-overview-ring__arc--followers"
                                  cx="48"
                                  cy="48"
                                  r={reachRingMetrics.radius}
                                  pathLength={100}
                                  strokeDasharray={`${reachRingMetrics.followerPercentOfPath} 100`}
                                  strokeDashoffset="0"
                                  style={
                                    {
                                      "--arc-length": `${reachRingMetrics.followerPercentOfPath}`,
                                      "--arc-offset": "0",
                                    } as CSSProperties
                                  }
                                />
                                <circle
                                  className="dataset-overview-ring__arc dataset-overview-ring__arc--nonfollowers"
                                  cx="48"
                                  cy="48"
                                  r={reachRingMetrics.radius}
                                  pathLength={100}
                                  strokeDasharray={`${reachRingMetrics.nonFollowerPercentOfPath} 100`}
                                  strokeDashoffset={reachRingMetrics.nonFollowerOffsetPercent}
                                  style={
                                    {
                                      "--arc-length": `${reachRingMetrics.nonFollowerPercentOfPath}`,
                                      "--arc-offset": `${reachRingMetrics.nonFollowerOffsetPercent}`,
                                    } as CSSProperties
                                  }
                                />
                              </svg>
                            ) : null}
                            <div className="dataset-overview-ring__core">
                              <strong>
                                <AnimatedValue
                                  value={dataset.metrics?.reachNonFollowersPercent}
                                  variant="percent"
                                  precision={
                                    typeof dataset.metrics?.reachNonFollowersPercent === "number" &&
                                    dataset.metrics.reachNonFollowersPercent % 1 !== 0
                                      ? 1
                                      : 0
                                  }
                                  fallback="--"
                                  animateKey={`${motionKey}-views-non-followers-core`}
                                  reducedMotion={prefersReducedMotion}
                                />
                              </strong>
                              <span>non-followers</span>
                            </div>
                          </div>

                          <div className="dataset-overview-views-legend">
                            {viewsAudienceRows.map((row) => (
                              <div key={row.key} className={`dataset-overview-views-legend__item ${row.className}`}>
                                <span>
                                  <i className={`dataset-overview-split-dot dataset-overview-split-dot--${row.key}`} aria-hidden="true" />
                                  {row.label}
                                </span>
                                <strong>
                                  <AnimatedValue
                                    value={row.value}
                                    variant="percent"
                                    precision={typeof row.value === "number" && row.value % 1 !== 0 ? 1 : 0}
                                    animateKey={`${motionKey}-views-${row.key}`}
                                    reducedMotion={prefersReducedMotion}
                                  />
                                </strong>
                              </div>
                            ))}
                          </div>
                        </div>
                      </section>

                      <section className="dataset-overview-views-card dataset-overview-views-card--activity">
                        <div className="dataset-overview-views-card__head">
                          <div>
                            <span className="dataset-overview-panel-title">view outcomes</span>
                            <p className="dataset-overview-panel-subtitle">reach and profile actions from this export</p>
                          </div>
                          <div className="dataset-overview-views-card__total">
                            <span>profile activity</span>
                            <strong>
                              <AnimatedValue
                                value={profileActivityTotal}
                                variant="metric"
                                animateKey={`${motionKey}-views-profile-activity`}
                                reducedMotion={prefersReducedMotion}
                              />
                            </strong>
                          </div>
                        </div>
                        <div className="dataset-overview-views-activity-list">
                          {viewsActivityRows.map((row) => {
                            const Icon = row.Icon;

                            return (
                              <div key={row.key} className="dataset-overview-views-activity-row">
                                <i aria-hidden="true">
                                  <Icon size={15} strokeWidth={1.9} />
                                </i>
                                <div>
                                  <span>{row.label}</span>
                                  <small>{row.detail}</small>
                                </div>
                                <strong>
                                  <AnimatedValue
                                    value={row.value}
                                    variant="metric"
                                    animateKey={`${motionKey}-views-${row.key}-row`}
                                    reducedMotion={prefersReducedMotion}
                                  />
                                </strong>
                              </div>
                            );
                          })}
                        </div>
                      </section>

                    </article>
                  ) : (
                  <article className="dataset-overview-drill-panel">
                    <button
                      type="button"
                      className="dataset-meta-value dataset-meta-value--link dataset-overview-drill-back"
                      onClick={() => setIsOverviewDetailOpen(false)}
                    >
                      <ChevronLeft size={15} aria-hidden="true" />
                      back to overview
                    </button>

                    <div className="dataset-overview-drill-panel__summary">
                      <div className="dataset-overview-drill-panel__head">
                        <i className="dataset-overview-drill-panel__icon" aria-hidden="true">
                          <ActiveOverviewPanelIcon size={18} strokeWidth={1.9} />
                        </i>
                        <div>
                          <span className="dataset-overview-panel-title">{activeOverviewPanel.title}</span>
                          <p className="dataset-overview-panel-subtitle">{activeOverviewPanel.subtitle}</p>
                        </div>
                      </div>
                      <strong className="dataset-overview-drill-panel__value">
                        <AnimatedValue
                          value={activeOverviewPanel.value}
                          variant="metric"
                          animateKey={`${motionKey}-${activeOverviewCard.key}-detail-value`}
                          reducedMotion={prefersReducedMotion}
                        />
                      </strong>
                      <p className="dataset-overview-drill-panel__insight">{activeOverviewPanel.insight}</p>
                    </div>

                    <div className="dataset-overview-drill-panel__stats">
                      {activeOverviewPanel.stats.map((stat) => (
                        <div key={stat.label} className="dataset-overview-drill-stat">
                          <span>{stat.label}</span>
                          <strong>
                            {stat.variant === "percent" ? (
                              <AnimatedValue
                                value={stat.value}
                                variant="percent"
                                precision={typeof stat.value === "number" && stat.value % 1 !== 0 ? 1 : 0}
                                animateKey={`${motionKey}-${activeOverviewCard.key}-${stat.label}`}
                                reducedMotion={prefersReducedMotion}
                              />
                            ) : stat.variant === "ratio" ? (
                              formatCompactRatio(stat.value)
                            ) : (
                              <AnimatedValue
                                value={stat.value}
                                variant="metric"
                                animateKey={`${motionKey}-${activeOverviewCard.key}-${stat.label}`}
                                reducedMotion={prefersReducedMotion}
                              />
                            )}
                          </strong>
                        </div>
                      ))}
                    </div>

                    <div
                      className={`dataset-overview-drill-panel__bars${
                        shouldUseCompositionBars ? " dataset-overview-drill-panel__bars--composition" : ""
                      }`}
                      aria-label={`${activeOverviewPanel.title} visual breakdown`}
                    >
                      {shouldUseCompositionBars ? (
                        <>
                          <div className="dataset-overview-composition-bar" aria-hidden="true">
                            {activeOverviewPanel.bars.map((item, index) => (
                              <span
                                key={item.key}
                                className={`dataset-overview-composition-bar__segment dataset-overview-composition-bar__segment--${index + 1}`}
                                style={
                                  {
                                    "--segment-width": `${item.percent}%`,
                                  } as CSSProperties
                                }
                              />
                            ))}
                          </div>
                          <div className="dataset-overview-composition-list">
                            {activeOverviewPanel.bars.map((item, index) => (
                              <div key={item.key} className="dataset-overview-composition-item">
                                <span>
                                  <i
                                    className={`dataset-overview-composition-dot dataset-overview-composition-dot--${index + 1}`}
                                    aria-hidden="true"
                                  />
                                  {item.label}
                                </span>
                                <strong>
                                  {item.display}
                                  <small>{formatCompactPercent(item.percent)}</small>
                                </strong>
                              </div>
                            ))}
                          </div>
                        </>
                      ) : (
                        activeOverviewPanel.bars.map((item, index) => (
                          <div
                            key={item.key}
                            className={`dataset-overview-drill-bar dataset-overview-drill-bar--${index + 1}`}
                          >
                            <div className="dataset-overview-drill-bar__head">
                              <span>{item.label}</span>
                              <strong>{item.display}</strong>
                            </div>
                            <div className="dataset-overview-drill-bar__track" aria-hidden="true">
                              <div
                                className="dataset-overview-drill-bar__fill"
                                style={
                                  {
                                    "--bar-width": `${item.percent}%`,
                                  } as CSSProperties
                                }
                              />
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </article>
                  )}
                </div>
              ) : (
                <div className="dataset-overview-grid" aria-label="Dataset overview metrics">
                  {overviewKpiCards.map((card) => {
                    const Icon = card.Icon;

                    return (
                      <button
                        key={card.key}
                        type="button"
                        className={`dataset-overview-card dataset-overview-card--button dataset-overview-card--story${
                          card.key === activeOverviewCardKey ? " is-active" : ""
                        }`}
                        onClick={() => openOverviewDetail(card.key)}
                        aria-label={`Open ${card.label} detail`}
                      >
                        <div className="dataset-overview-card__head">
                          <span className="dataset-overview-card__label">{card.label}</span>
                          <i className="dataset-overview-card__icon" aria-hidden="true">
                            <Icon size={15} strokeWidth={1.9} />
                          </i>
                        </div>
                        <strong className="dataset-overview-value">
                          <AnimatedValue
                            value={card.value}
                            variant="metric"
                            animateKey={`${motionKey}-${card.key}`}
                            reducedMotion={prefersReducedMotion}
                          />
                        </strong>
                        <small className="dataset-overview-card__support">{card.support}</small>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="dataset-overview-section-head">
              <div>
                <span className="dataset-overview-panel-title">insight breakdown</span>
                <p className="dataset-overview-panel-subtitle">
                  reach, audience, growth, and content context from this export
                </p>
              </div>
            </div>

            <div className="dataset-overview-support-grid">
              <div className="dataset-overview-support-column dataset-overview-support-column--primary">

              <article className="dataset-overview-support-card dataset-overview-support-card--snapshot">
                <div className="dataset-overview-support-head">
                  <div className="dataset-overview-panel-copy">
                    <span className="dataset-overview-panel-title">audience details</span>
                    <p className="dataset-overview-panel-subtitle">
                      geography and demographic context detected from the export
                    </p>
                  </div>
                </div>
                <div className="dataset-overview-detail-list">
                  <div>
                    <span>
                      <MapPin size={14} aria-hidden="true" />
                      cities
                    </span>
                    {followerCityBreakdown.length ? (
                      <div className="dataset-overview-breakdown-list">
                        {followerCityBreakdown.map((item) => (
                          <div key={item.label} className="dataset-overview-breakdown-row">
                            <div className="dataset-overview-breakdown-row__head">
                              <strong>{formatProperCaseLabel(item.label)}</strong>
                              <span className="dataset-overview-percent-pill">
                                {formatCompactPercent(item.percent, "--")}
                              </span>
                            </div>
                            <div className="dataset-overview-snapshot-bar dataset-overview-snapshot-bar--city" aria-hidden="true">
                              <div
                                className="dataset-overview-snapshot-bar__fill"
                                style={{ width: `${getClampedPercent(item.percent)}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <strong>not detected</strong>
                    )}
                  </div>
                  <div>
                    <span>
                      <Globe2 size={14} aria-hidden="true" />
                      countries
                    </span>
                    {followerCountryBreakdown.length ? (
                      <div className="dataset-overview-breakdown-list">
                        {followerCountryBreakdown.map((item) => (
                          <div key={item.label} className="dataset-overview-breakdown-row">
                            <div className="dataset-overview-breakdown-row__head">
                              <strong>{formatProperCaseLabel(item.label)}</strong>
                              <span className="dataset-overview-percent-pill">
                                {formatCompactPercent(item.percent, "--")}
                              </span>
                            </div>
                            <div className="dataset-overview-snapshot-bar dataset-overview-snapshot-bar--country" aria-hidden="true">
                              <div
                                className="dataset-overview-snapshot-bar__fill"
                                style={{ width: `${getClampedPercent(item.percent)}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <strong>not detected</strong>
                    )}
                  </div>
                  <div>
                    <span>
                      <UsersRound size={14} aria-hidden="true" />
                      age range
                    </span>
                    {followerAgeBreakdownAll.length ? (
                      <div className="dataset-overview-breakdown-list">
                        {followerAgeBreakdownAll.map((item) => (
                          <div key={item.label} className="dataset-overview-breakdown-row">
                            <div className="dataset-overview-breakdown-row__head">
                              <strong>{item.label}</strong>
                              <span className="dataset-overview-percent-pill">
                                {formatCompactPercent(item.percent, "--")}
                              </span>
                            </div>
                            <div className="dataset-overview-snapshot-bar dataset-overview-snapshot-bar--age" aria-hidden="true">
                              <div
                                className="dataset-overview-snapshot-bar__fill"
                                style={{ width: `${getClampedPercent(item.percent)}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <strong>not detected</strong>
                    )}
                  </div>
                  <div>
                    <span>
                      <VenusAndMars size={14} aria-hidden="true" />
                      gender split
                    </span>
                    <div className="dataset-overview-snapshot-gender-row">
                      <div className="dataset-overview-snapshot-gender-ring">
                        {genderRingMetrics ? (
                          <svg
                            className="dataset-overview-snapshot-gender-ring__svg"
                            viewBox="0 0 72 72"
                            aria-label="Gender split breakdown"
                          >
                            <circle className="dataset-overview-snapshot-gender-ring__track" cx="36" cy="36" r="27" />
                            <circle
                              className="dataset-overview-snapshot-gender-ring__arc dataset-overview-snapshot-gender-ring__arc--women"
                              cx="36"
                              cy="36"
                              r={genderRingMetrics.radius}
                              pathLength={100}
                              strokeDasharray={`${genderRingMetrics.primaryPercentOfPath} 100`}
                              strokeDashoffset="0"
                              style={
                                {
                                  "--arc-length": `${genderRingMetrics.primaryPercentOfPath}`,
                                  "--arc-offset": "0",
                                } as CSSProperties
                              }
                            />
                            <circle
                              className="dataset-overview-snapshot-gender-ring__arc dataset-overview-snapshot-gender-ring__arc--men"
                              cx="36"
                              cy="36"
                              r={genderRingMetrics.radius}
                              pathLength={100}
                              strokeDasharray={`${genderRingMetrics.secondaryPercentOfPath} 100`}
                              strokeDashoffset={genderRingMetrics.secondaryOffsetPercent}
                              style={
                                {
                                  "--arc-length": `${genderRingMetrics.secondaryPercentOfPath}`,
                                  "--arc-offset": `${genderRingMetrics.secondaryOffsetPercent}`,
                                } as CSSProperties
                              }
                            />
                            <circle
                              className="dataset-overview-snapshot-gender-ring__hit dataset-overview-snapshot-gender-ring__hit--women"
                              cx="36"
                              cy="36"
                              r={genderRingMetrics.radius}
                              pathLength={100}
                              strokeDasharray={`${genderRingMetrics.primaryPercentOfPath} 100`}
                              strokeDashoffset="0"
                              tabIndex={0}
                              aria-label={`women ${formatCompactPercent(dataset.metrics?.womenFollowerPercent)}`}
                            />
                            <circle
                              className="dataset-overview-snapshot-gender-ring__hit dataset-overview-snapshot-gender-ring__hit--men"
                              cx="36"
                              cy="36"
                              r={genderRingMetrics.radius}
                              pathLength={100}
                              strokeDasharray={`${genderRingMetrics.secondaryPercentOfPath} 100`}
                              strokeDashoffset={genderRingMetrics.secondaryOffsetPercent}
                              tabIndex={0}
                              aria-label={`men ${formatCompactPercent(dataset.metrics?.menFollowerPercent)}`}
                            />
                          </svg>
                        ) : null}
                        <div className="dataset-overview-snapshot-gender-ring__core">
                          <div className="dataset-overview-snapshot-gender-ring__stack">
                            <strong className="dataset-overview-snapshot-gender-ring__value">
                                <AnimatedValue
                                  value={dataset.metrics?.womenFollowerPercent}
                                  variant="percent"
                                  precision={typeof dataset.metrics?.womenFollowerPercent === "number" && dataset.metrics.womenFollowerPercent % 1 !== 0 ? 1 : 0}
                                  fallback="--"
                                  animateKey={`${motionKey}-women-percent-core`}
                                  reducedMotion={prefersReducedMotion}
                                />
                            </strong>
                            <span className="dataset-overview-snapshot-gender-ring__label">women</span>
                          </div>
                        </div>
                        <div
                          className="dataset-overview-snapshot-gender-tooltip dataset-overview-snapshot-gender-tooltip--women"
                          aria-hidden="true"
                        >
                          <span className="dataset-overview-snapshot-gender-tooltip__label">
                            <i className="dataset-overview-snapshot-gender-dot dataset-overview-snapshot-gender-dot--women" aria-hidden="true" />
                            women
                          </span>
                          <strong>{formatCompactPercent(dataset.metrics?.womenFollowerPercent)}</strong>
                        </div>
                        <div
                          className="dataset-overview-snapshot-gender-tooltip dataset-overview-snapshot-gender-tooltip--men"
                          aria-hidden="true"
                        >
                          <span className="dataset-overview-snapshot-gender-tooltip__label">
                            <i className="dataset-overview-snapshot-gender-dot dataset-overview-snapshot-gender-dot--men" aria-hidden="true" />
                            men
                          </span>
                          <strong>{formatCompactPercent(dataset.metrics?.menFollowerPercent)}</strong>
                        </div>
                      </div>
                      <div className="dataset-overview-snapshot-gender-legend" aria-hidden="true">
                        <div>
                          <span>
                            <i className="dataset-overview-snapshot-gender-dot dataset-overview-snapshot-gender-dot--women" />
                            women
                          </span>
                            <strong>
                              <AnimatedValue
                                value={dataset.metrics?.womenFollowerPercent}
                                variant="percent"
                                precision={typeof dataset.metrics?.womenFollowerPercent === "number" && dataset.metrics.womenFollowerPercent % 1 !== 0 ? 1 : 0}
                                fallback="--"
                                animateKey={`${motionKey}-women-percent-legend`}
                                reducedMotion={prefersReducedMotion}
                              />
                            </strong>
                        </div>
                        <div>
                          <span>
                            <i className="dataset-overview-snapshot-gender-dot dataset-overview-snapshot-gender-dot--men" />
                            men
                          </span>
                            <strong>
                              <AnimatedValue
                                value={dataset.metrics?.menFollowerPercent}
                                variant="percent"
                                precision={typeof dataset.metrics?.menFollowerPercent === "number" && dataset.metrics.menFollowerPercent % 1 !== 0 ? 1 : 0}
                                fallback="--"
                                animateKey={`${motionKey}-men-percent-legend`}
                                reducedMotion={prefersReducedMotion}
                              />
                            </strong>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </article>

              <article
                className={`dataset-overview-support-card dataset-overview-support-card--movement is-${getTrendTone(
                  dataset.metrics?.netFollowersInRange,
                )} dataset-overview-support-card--movement-slot`}
              >
                <div className="dataset-overview-support-head">
                  <div className="dataset-overview-panel-copy">
                    <span className="dataset-overview-panel-title">follower growth</span>
                    <p className="dataset-overview-panel-subtitle">
                      follows, unfollows, and net movement across the export window
                    </p>
                  </div>
                </div>
                <div className="dataset-overview-movement-grid">
                  <div className="dataset-overview-movement-stat dataset-overview-movement-stat--positive">
                    <i className="dataset-overview-movement-stat__icon" aria-hidden="true">
                      <UserPlus size={14} />
                    </i>
                    <span>follows</span>
                      <strong>
                        <AnimatedValue
                          value={dataset.metrics?.followsInRange}
                          variant="signed"
                          animateKey={`${motionKey}-follows-in-range`}
                          reducedMotion={prefersReducedMotion}
                        />
                      </strong>
                    <small>accounts gained</small>
                  </div>
                  <div className="dataset-overview-movement-stat dataset-overview-movement-stat--negative">
                    <i className="dataset-overview-movement-stat__icon" aria-hidden="true">
                      <UserMinus size={14} />
                    </i>
                    <span>unfollows</span>
                      <strong>
                        <AnimatedValue
                          value={
                            typeof dataset.metrics?.unfollowsInRange === "number"
                              ? -dataset.metrics.unfollowsInRange
                              : null
                          }
                          variant="signed"
                          animateKey={`${motionKey}-unfollows-in-range`}
                          reducedMotion={prefersReducedMotion}
                        />
                      </strong>
                    <small>accounts lost</small>
                  </div>
                  <div
                    className={`dataset-overview-movement-stat dataset-overview-movement-stat--net is-${getTrendTone(
                      dataset.metrics?.netFollowersInRange,
                    )}`}
                  >
                    <i className="dataset-overview-movement-stat__icon" aria-hidden="true">
                      <ArrowDownUp size={14} />
                    </i>
                    <span>net change</span>
                      <strong>
                        <AnimatedValue
                          value={dataset.metrics?.netFollowersInRange}
                          variant="signed"
                          animateKey={`${motionKey}-net-followers-in-range`}
                          reducedMotion={prefersReducedMotion}
                        />
                      </strong>
                    <small>net audience growth</small>
                  </div>
                </div>
              </article>
            </div>

            <div className="dataset-overview-support-column dataset-overview-support-column--secondary">
              <article className="dataset-overview-support-card dataset-overview-support-card--reach">
                <div className="dataset-overview-support-head">
                  <div className="dataset-overview-panel-copy">
                    <span className="dataset-overview-panel-title">views audience split</span>
                    <p className="dataset-overview-panel-subtitle">
                      follower vs non-follower reach from Instagram insights
                    </p>
                  </div>
                </div>
                <div className="dataset-overview-ring-row">
                  <div className="dataset-overview-ring">
                    {reachRingMetrics ? (
                      <svg className="dataset-overview-ring__svg" viewBox="0 0 96 96" aria-label="Reach mix breakdown">
                        <circle className="dataset-overview-ring__track" cx="48" cy="48" r="34" />
                        <circle
                          className="dataset-overview-ring__arc dataset-overview-ring__arc--followers"
                          cx="48"
                          cy="48"
                          r={reachRingMetrics.radius}
                          pathLength={100}
                          strokeDasharray={`${reachRingMetrics.followerPercentOfPath} 100`}
                          strokeDashoffset="0"
                          style={
                            {
                              "--arc-length": `${reachRingMetrics.followerPercentOfPath}`,
                              "--arc-offset": "0",
                            } as CSSProperties
                          }
                        />
                        <circle
                          className="dataset-overview-ring__arc dataset-overview-ring__arc--nonfollowers"
                          cx="48"
                          cy="48"
                          r={reachRingMetrics.radius}
                          pathLength={100}
                          strokeDasharray={`${reachRingMetrics.nonFollowerPercentOfPath} 100`}
                          strokeDashoffset={reachRingMetrics.nonFollowerOffsetPercent}
                          style={
                            {
                              "--arc-length": `${reachRingMetrics.nonFollowerPercentOfPath}`,
                              "--arc-offset": `${reachRingMetrics.nonFollowerOffsetPercent}`,
                            } as CSSProperties
                          }
                        />
                        <circle
                          className="dataset-overview-ring__hit dataset-overview-ring__hit--followers"
                          cx="48"
                          cy="48"
                          r={reachRingMetrics.radius}
                          pathLength={100}
                          strokeDasharray={`${reachRingMetrics.followerPercentOfPath} 100`}
                          strokeDashoffset="0"
                          tabIndex={0}
                          aria-label={`followers ${formatCompactPercent(dataset.metrics?.reachFollowersPercent)}`}
                        />
                        <circle
                          className="dataset-overview-ring__hit dataset-overview-ring__hit--nonfollowers"
                          cx="48"
                          cy="48"
                          r={reachRingMetrics.radius}
                          pathLength={100}
                          strokeDasharray={`${reachRingMetrics.nonFollowerPercentOfPath} 100`}
                          strokeDashoffset={reachRingMetrics.nonFollowerOffsetPercent}
                          tabIndex={0}
                          aria-label={`non-followers ${formatCompactPercent(dataset.metrics?.reachNonFollowersPercent)}`}
                        />
                      </svg>
                    ) : null}
                    <div className="dataset-overview-ring__core">
                        <strong>
                          <AnimatedValue
                            value={dataset.metrics?.reachNonFollowersPercent}
                            variant="percent"
                            precision={typeof dataset.metrics?.reachNonFollowersPercent === "number" && dataset.metrics.reachNonFollowersPercent % 1 !== 0 ? 1 : 0}
                            fallback="--"
                            animateKey={`${motionKey}-reach-non-followers`}
                            reducedMotion={prefersReducedMotion}
                          />
                        </strong>
                      <span>non-followers</span>
                    </div>
                    <div
                      className="dataset-overview-ring__tooltip dataset-overview-ring__tooltip--followers"
                      aria-hidden="true"
                    >
                      <span className="dataset-overview-ring__tooltip-label">
                        <i className="dataset-overview-split-dot dataset-overview-split-dot--followers" aria-hidden="true" />
                        followers
                      </span>
                      <strong>{formatCompactPercent(dataset.metrics?.reachFollowersPercent)}</strong>
                    </div>
                    <div
                      className="dataset-overview-ring__tooltip dataset-overview-ring__tooltip--nonfollowers"
                      aria-hidden="true"
                    >
                      <span className="dataset-overview-ring__tooltip-label">
                        <i className="dataset-overview-split-dot dataset-overview-split-dot--nonfollowers" aria-hidden="true" />
                        non-followers
                      </span>
                      <strong>{formatCompactPercent(dataset.metrics?.reachNonFollowersPercent)}</strong>
                    </div>
                  </div>
                  <div className="dataset-overview-split-list">
                    <div>
                      <span className="dataset-overview-split-label">
                        <i className="dataset-overview-split-dot dataset-overview-split-dot--followers" aria-hidden="true" />
                        followers
                      </span>
                      <strong>
                        <AnimatedValue
                          value={dataset.metrics?.reachFollowersPercent}
                          variant="percent"
                          precision={typeof dataset.metrics?.reachFollowersPercent === "number" && dataset.metrics.reachFollowersPercent % 1 !== 0 ? 1 : 0}
                          animateKey={`${motionKey}-reach-followers-split`}
                          reducedMotion={prefersReducedMotion}
                        />
                      </strong>
                    </div>
                    <div>
                      <span className="dataset-overview-split-label">
                        <i className="dataset-overview-split-dot dataset-overview-split-dot--nonfollowers" aria-hidden="true" />
                        non-followers
                      </span>
                      <strong>
                        <AnimatedValue
                          value={dataset.metrics?.reachNonFollowersPercent}
                          variant="percent"
                          precision={typeof dataset.metrics?.reachNonFollowersPercent === "number" && dataset.metrics.reachNonFollowersPercent % 1 !== 0 ? 1 : 0}
                          animateKey={`${motionKey}-reach-non-followers-split`}
                          reducedMotion={prefersReducedMotion}
                        />
                      </strong>
                    </div>
                  </div>
                </div>
              </article>

            </div>
            </div>
          </div>
          )}
        </article>

        <div className="dataset-workspace__right-stack">
          <aside className="dataset-side-panel dataset-side-panel--right dataset-dashboard-section dataset-dashboard-section--sidebar">
            <div className="dataset-side-panel__head">
              <p className="section-kicker">workspace</p>
            </div>

            <div className="dataset-side-panel__body">
              <div className="workspace-tool-launch">
                <p className="workspace-tool-launch__label">available now</p>
                {isNotFollowingBackView ? (
                  <div
                    className="workspace-tool-pill workspace-tool-pill--featured workspace-tool-pill--current is-live"
                    aria-label="Not following back tool is open"
                  >
                    <span className="workspace-tool-icon" aria-hidden="true">
                      <UserRoundX size={16} strokeWidth={1.9} />
                    </span>
                    <span className="workspace-tool-copy">
                      <strong>not following back</strong>
                    </span>
                  </div>
                ) : (
                  <Link
                    href={notFollowingBackHref}
                    className="workspace-tool-pill workspace-tool-pill--featured is-live"
                    aria-label="Open not following back tool"
                  >
                    <span className="workspace-tool-icon" aria-hidden="true">
                      <UserRoundX size={16} strokeWidth={1.9} />
                    </span>
                    <span className="workspace-tool-copy">
                      <strong>not following back</strong>
                    </span>
                  </Link>
                )}
              </div>

              <article className="dataset-workspace__support-card">
                <p className="dataset-meta-label">relationship signals</p>
                <div className="dataset-relationship-signals">
                  {relationshipSignalRows.map((row) => {
                    const Icon = row.Icon;

                    return (
                      <div key={row.key} className={`dataset-relationship-signal ${row.accentClassName}`}>
                        <div className="dataset-relationship-signal__head">
                          <div className="dataset-relationship-signal__copy">
                            <span className="dataset-relationship-signal__label">
                              <i className="dataset-relationship-signal__icon" aria-hidden="true">
                                <Icon size={14} strokeWidth={1.9} />
                              </i>
                              {row.label}
                            </span>
                          </div>
                          <div className="dataset-relationship-signal__value">
                            <strong>
                              <AnimatedValue
                                value={row.value}
                                variant="metric"
                                fallback="0"
                                animateKey={`${motionKey}-relationship-${row.key}`}
                                reducedMotion={prefersReducedMotion}
                              />
                            </strong>
                            <span className="dataset-relationship-signal__support">{row.badge}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </article>

              <button
                type="button"
                className="hero-btn hero-btn-secondary dataset-side-panel__action"
                onClick={() => setIsToolsModalOpen(true)}
              >
                <Wrench size={16} aria-hidden="true" />
                tools
              </button>
            </div>
          </aside>

        </div>
      </div>

      {isDatasetsModalOpen
        ? createPortal(
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
                  <label className="dataset-modal__sort">
                    <span className="dataset-modal__sort-label">sort</span>
                    <span className="dataset-modal__sort-control">
                      <select
                        value={datasetSortOrder}
                        onChange={(event) => {
                          setDatasetSortOrder(event.target.value as DatasetSortOrder);
                          setOpenDatasetMenuId(null);
                          setRenamingDatasetId(null);
                          setFloatingPanelStyle(null);
                          setDatasetNameDraft("");
                        }}
                        aria-label="sort exports"
                      >
                        {datasetSortOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={16} aria-hidden="true" />
                    </span>
                  </label>
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
                const dateRangeLabel = getDatasetExportWindowValue(item) || item.importReview.sourceLabel;
                const accountUsername = item.profile?.username?.trim();
                const accountHandle = accountUsername ? `@${accountUsername}` : "";

                return (
                  <div
                    key={item.id}
                    className={`dataset-modal__row${isCurrentDataset ? " is-current" : ""}`}
                  >
                    {isCurrentDataset ? (
                      <div className="dataset-modal__row-main">
                        <div className="dataset-modal__row-topline">
                          <div className="dataset-modal__row-title">
                            <strong>{item.name}</strong>
                            {accountHandle ? <span className="dataset-modal__row-handle">{accountHandle}</span> : null}
                          </div>
                          <div className="dataset-modal__row-topmeta">
                            <p className="dataset-modal__row-date">imported {formatDate(item.createdAt)}</p>
                            <span className={`dataset-modal__row-status${isCurrentDataset ? " is-current" : ""}`}>
                              {isCurrentDataset ? "active" : "saved"}
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
                          <div className="dataset-modal__row-title">
                            <strong>{item.name}</strong>
                            {accountHandle ? <span className="dataset-modal__row-handle">{accountHandle}</span> : null}
                          </div>
                          <div className="dataset-modal__row-topmeta">
                            <p className="dataset-modal__row-date">imported {formatDate(item.createdAt)}</p>
                            <span className={`dataset-modal__row-status${isCurrentDataset ? " is-current" : ""}`}>
                              {isCurrentDataset ? "active" : "saved"}
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
                              ref={floatingMenuRef}
                              className="dataset-modal__menu dataset-modal__menu--actions"
                              style={floatingPanelStyle ?? undefined}
                              role="menu"
                              aria-label={`Actions for ${item.name}`}
                              onClick={(event) => event.stopPropagation()}
                            >
                              <button
                                type="button"
                                className="dataset-modal__menu-item"
                                role="menuitem"
                                aria-label={`edit ${item.name}`}
                                title="edit"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  startRenamingDataset(item.id, item.name);
                                }}
                              >
                                <Pencil size={14} aria-hidden="true" />
                              </button>
                              <button
                                type="button"
                                className="dataset-modal__menu-item dataset-modal__menu-item--danger"
                                role="menuitem"
                                aria-label={`delete ${item.name}`}
                                title="delete"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setOpenDatasetMenuId(null);
                                  setRenamingDatasetId(null);
                                  setFloatingPanelStyle(null);
                                  setDeleteConfirmDatasetId(item.id);
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
                  </div>
                );
              })}
            </div>

            <div className="dataset-modal__footer">
              <p className="dataset-modal__footer-note">
                {hasReachedDatasetLimit
                  ? `saved export limit reached (${MAX_LOCAL_DATASETS}/${MAX_LOCAL_DATASETS}). open storage to review or delete saved datasets.`
                  : "saved exports stay tied to the instagram archives already imported into your workspace."}
              </p>
              <Link
                href="/app/datasets"
                className="dataset-modal__footer-cta"
                onClick={closeDatasetsModal}
              >
                <Database size={16} strokeWidth={2.1} aria-hidden="true" />
                storage
              </Link>
            </div>
              </div>
            </div>,
            document.body,
          )
        : null}

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
                aria-labelledby="delete-export-title"
                aria-describedby="delete-export-copy"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="dataset-modal__confirm-copy">
                  <h2 id="delete-export-title">delete export?</h2>
                  <p id="delete-export-copy">this removes this saved export from your workspace.</p>
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
                    onClick={() => removeDataset(deleteConfirmDataset.id)}
                  >
                    delete
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}

      {isToolsModalOpen
        ? createPortal(
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
                  available now and next pro tools.
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
                    aria-label={`Open ${tool.title}`}
                  >
                    <span className="dataset-tool-card__icon" aria-hidden="true">
                      <Icon size={19} strokeWidth={1.9} />
                    </span>
                    <span className="dataset-tool-card__content">
                      <strong className="dataset-tool-card__title">{tool.title}</strong>
                      <span className={`dataset-tool-card__badge ${badgeClassName}`.trim()}>
                        {tool.availability}
                      </span>
                    </span>
                  </Link>
                ) : (
                  <div key={tool.id} className={`dataset-tool-card ${badgeClassName}`.trim()} aria-disabled="true">
                    <span className="dataset-tool-card__icon" aria-hidden="true">
                      <Icon size={19} strokeWidth={1.9} />
                    </span>
                    <span className="dataset-tool-card__content">
                      <strong className="dataset-tool-card__title">{tool.title}</strong>
                      <span className={`dataset-tool-card__badge ${badgeClassName}`.trim()}>
                        {tool.availability}
                      </span>
                    </span>
                  </div>
                );
              })}
            </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </section>
  );
}
