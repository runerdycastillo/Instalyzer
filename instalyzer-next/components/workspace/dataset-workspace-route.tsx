"use client";

import {
  ArrowDownUp,
  BarChart3,
  Bookmark,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronDown,
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
  UserCheck,
  UserPlus,
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
import { NotFollowingBackWorkspaceView } from "@/components/workspace/not-following-back-workspace-view";
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
  activeToolId?: "not-following-back";
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

function formatDetectedDataBadges(categoryCounts?: Array<[string, number]>) {
  if (!categoryCounts?.length) return [];

  return categoryCounts
    .slice()
    .sort((a, b) => b[1] - a[1])
    .map(([label]) => formatProperCaseLabel(label))
    .slice(0, 6);
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

function buildAudienceTrendChart(
  activityByDay:
    | Array<{
        label: string;
        shortLabel: string;
        value: number | null;
      }>
    | null
    | undefined,
) {
  const points = (activityByDay || []).map((item, index) => ({
    ...item,
    index,
    numericValue:
      typeof item.value === "number" && Number.isFinite(item.value) ? item.value : null,
  }));

  const validPoints = points.filter(
    (item): item is (typeof points)[number] & { numericValue: number } =>
      typeof item.numericValue === "number" && Number.isFinite(item.numericValue),
  );
  if (!validPoints.length) return null;

  const width = 320;
  const height = 108;
  const paddingX = 12;
  const topPadding = 14;
  const bottomPadding = 18;
  const minValue = Math.min(...validPoints.map((item) => item.numericValue));
  const maxValue = Math.max(...validPoints.map((item) => item.numericValue));
  const range = maxValue - minValue || 1;
  const stepX = points.length > 1 ? (width - paddingX * 2) / (points.length - 1) : 0;

  const chartPoints = points.map((item) => {
    const normalized =
      typeof item.numericValue === "number" ? (item.numericValue - minValue) / range : 0;
    return {
      ...item,
      x: paddingX + stepX * item.index,
      y: height - bottomPadding - normalized * (height - topPadding - bottomPadding),
    };
  });

  const linePath = chartPoints
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`)
    .join(" ");
  const areaPath = `${linePath} L ${chartPoints[chartPoints.length - 1]?.x.toFixed(1)} ${(height - bottomPadding).toFixed(1)} L ${chartPoints[0]?.x.toFixed(1)} ${(height - bottomPadding).toFixed(1)} Z`;
  const peakPoint = validPoints.reduce((best, item) => (item.numericValue > best.numericValue ? item : best), validPoints[0]);

  return {
    width,
    height,
    chartPoints,
    linePath,
    areaPath,
    peakLabel: peakPoint.label,
    peakValue: peakPoint.numericValue,
  };
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

function formatExportMediaQuality(scope?: {
  exportRequestMetadataDetected?: boolean;
  exportRequestMediaQuality?: string;
}) {
  const mediaQuality = String(scope?.exportRequestMediaQuality || "").trim();
  if (mediaQuality) return mediaQuality;
  if (scope?.exportRequestMetadataDetected === false) return "not included in this export";
  return "not available";
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
          <div className="dataset-overview-head dataset-dashboard-section dataset-dashboard-section--header">
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

export function DatasetWorkspaceRoute({ datasetId, activeToolId }: DatasetWorkspaceRouteProps) {
  const router = useRouter();
  const isWorkspaceHome = !datasetId;
  const isNotFollowingBackView = activeToolId === "not-following-back";
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
  const prefersReducedMotion = usePrefersReducedMotion();
  const activeDatasetId = hasMounted ? readActiveDatasetId() : null;
  const dataset = datasetId
    ? datasets.find((item) => item.id === datasetId) || findLocalDataset(datasetId)
    : datasets.find((item) => item.id === activeDatasetId) || datasets[0] || null;
  const motionKey = dataset?.id || "dataset-workspace";
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
  const overviewKpiCards = [
    {
      key: "accounts-reached",
      label: "accounts reached",
      value: accountsReached,
      Icon: Target,
      support:
        accountsReachedDelta !== null
          ? `${formatSignedPercent(accountsReachedDelta)} vs previous export`
          : (() => {
              const uniqueReachShare = calculatePercent(accountsReached, impressions);
              return uniqueReachShare !== null
                ? `${formatCompactPercent(uniqueReachShare)} unique share of impressions`
                : "comparison unavailable";
            })(),
    },
    {
      key: "profile-visits",
      label: "profile visits",
      value: profileVisits,
      Icon: Search,
      support: (() => {
        const visitShare = calculatePercent(profileVisits, impressions);
        return visitShare !== null ? `${formatCompactPercent(visitShare)} of total impressions` : "Not available";
      })(),
    },
    {
      key: "external-link-taps",
      label: "external link taps",
      value: externalLinkTaps,
      Icon: MousePointerClick,
      support: (() => {
        const visitConversion = calculatePercent(externalLinkTaps, profileVisits);
        return visitConversion !== null ? `${formatCompactPercent(visitConversion)} visit conversion` : "Not available";
      })(),
    },
    {
      key: "content-interactions",
      label: "content interactions",
      value: contentInteractions,
      Icon: Heart,
      support: (() => {
        const engagementRate = calculatePercent(contentInteractions, profileVisits);
        return engagementRate !== null ? `${formatCompactPercent(engagementRate)} engagement rate` : "Not available";
      })(),
    },
    {
      key: "accounts-engaged",
      label: "accounts engaged",
      value: accountsEngaged,
      Icon: UserCheck,
      support: (() => {
        const reachedShare = calculatePercent(accountsEngaged, accountsReached);
        return reachedShare !== null ? `${formatCompactPercent(reachedShare)} of reached accounts` : "Not available";
      })(),
    },
    {
      key: "impressions",
      label: "impressions",
      value: impressions,
      Icon: BarChart3,
      support: (() => {
        const impressionsPerAccount = calculateRatio(impressions, accountsReached);
        return impressionsPerAccount !== null
          ? `${formatCompactRatio(impressionsPerAccount)} impressions per reached account`
          : "Not available";
      })(),
    },
  ];
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
  const audienceTrendChart = buildAudienceTrendChart(dataset?.metrics?.followerActivityByDay);
  const detectedDataBadges = formatDetectedDataBadges(dataset?.meta?.categoryCounts);
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
  const overviewHref = datasetId ? `/app/datasets/${dataset.id}` : "/app";
  const notFollowingBackHref = `/app/datasets/${dataset.id}/tools/not-following-back`;

  return (
    <section className="dataset-workspace dataset-workspace--hydrated" aria-labelledby="dataset-workspace-title">
      <div className="dataset-workspace__grid dataset-workspace__grid--static">
        <aside className="dataset-side-panel dataset-side-panel--left dataset-dashboard-section dataset-dashboard-section--sidebar-left">
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
                      <span className="dataset-side-panel__recent-name-row">
                        <span className="dataset-side-panel__recent-name">{item.name}</span>
                        {isActiveDataset ? (
                          <span className="dataset-side-panel__active-pill">
                            <span className="dataset-side-panel__active-dot" aria-hidden="true" />
                            active
                          </span>
                        ) : null}
                      </span>
                      <span className="dataset-side-panel__recent-meta">
                        {isActiveDataset ? "selected dataset" : formatDate(item.createdAt)}
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
              <p className="section-kicker">
                {isNotFollowingBackView
                  ? "relationship tool"
                  : isWorkspaceHome
                    ? "workspace overview"
                    : "dataset overview"}
              </p>
              <h1 id="dataset-workspace-title" className="dataset-overview-title">
                {isNotFollowingBackView ? "not following back" : isWorkspaceHome ? "current workspace overview" : dataset.name}
              </h1>
              {isNotFollowingBackView ? (
                <p className="dataset-overview-copy dataset-overview-copy--inline">
                  Reviewing <strong>{dataset.name}</strong> inside the workspace shell.
                </p>
              ) : isWorkspaceHome ? (
                <p className="dataset-overview-copy dataset-overview-copy--inline">
                  Showing your latest saved dataset: <strong>{dataset.name}</strong>
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
            <NotFollowingBackWorkspaceView key={dataset.id} dataset={dataset} />
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
                  overview window: {formatOverviewWindow(dataset.scope)}
                </p>
              </div>
            </div>

            <div className="dataset-overview-grid">
              {overviewKpiCards.map((card) => {
                const Icon = card.Icon;

                return (
                  <article key={card.key} className="dataset-overview-card">
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
                  </article>
                );
              })}
            </div>

            <div className="dataset-overview-support-grid">
              <div className="dataset-overview-support-column dataset-overview-support-column--primary">

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
                            <AnimatedValue
                              value={dataset.metrics.topFollowerCityPercent}
                              variant="percent"
                              precision={typeof dataset.metrics.topFollowerCityPercent === "number" && dataset.metrics.topFollowerCityPercent % 1 !== 0 ? 1 : 0}
                              fallback="--"
                              animateKey={`${motionKey}-top-city-percent`}
                              reducedMotion={prefersReducedMotion}
                            />
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
                            <AnimatedValue
                              value={dataset.metrics.topFollowerCountryPercent}
                              variant="percent"
                              precision={typeof dataset.metrics.topFollowerCountryPercent === "number" && dataset.metrics.topFollowerCountryPercent % 1 !== 0 ? 1 : 0}
                              fallback="--"
                              animateKey={`${motionKey}-top-country-percent`}
                              reducedMotion={prefersReducedMotion}
                            />
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
                  <div className="dataset-overview-detail-list__section-break dataset-overview-detail-list__section-break--activity">
                    <span>
                      <CalendarDays size={14} aria-hidden="true" />
                      most active day
                    </span>
                    <div className="dataset-overview-activity-spotlight">
                      <div className="dataset-overview-activity-spotlight__highlight">
                        <strong>
                          {dataset.metrics?.topFollowerActivityDay || "not detected"}
                        </strong>
                        {dataset.metrics?.topFollowerActivityDay ? (
                          <small className="dataset-overview-detail-note">
                            <AnimatedValue
                              value={dataset.metrics.topFollowerActivityValue}
                              variant="metric"
                              fallback="--"
                              animateKey={`${motionKey}-top-follower-activity`}
                              reducedMotion={prefersReducedMotion}
                            />{" "}
                            follower activity
                          </small>
                        ) : null}
                      </div>
                      <div className="dataset-overview-activity-spotlight__trend">
                        <div className="dataset-overview-activity-spotlight__trend-head">
                          <span>follower activity trend</span>
                          {audienceTrendChart ? (
                            <small>peak on {audienceTrendChart.peakLabel.toLowerCase()}</small>
                          ) : (
                            <small>follower activity unavailable in this export</small>
                          )}
                        </div>
                        {audienceTrendChart ? (
                          <div className="dataset-overview-movement-chart" aria-hidden="true">
                            <svg
                              className="dataset-overview-movement-chart__svg"
                              viewBox={`0 0 ${audienceTrendChart.width} ${audienceTrendChart.height}`}
                            >
                              <defs>
                                <linearGradient id="movementTrendFill" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="rgba(74, 222, 128, 0.22)" />
                                  <stop offset="100%" stopColor="rgba(74, 222, 128, 0)" />
                                </linearGradient>
                              </defs>
                              <path className="dataset-overview-movement-chart__area" d={audienceTrendChart.areaPath} />
                              <path
                                className="dataset-overview-movement-chart__line"
                                d={audienceTrendChart.linePath}
                                pathLength={1}
                              />
                              {audienceTrendChart.chartPoints.map((point) => (
                                <circle
                                  key={point.label}
                                  className={`dataset-overview-movement-chart__point${
                                    point.label === audienceTrendChart.peakLabel ? " is-peak" : ""
                                  }`}
                                  cx={point.x}
                                  cy={point.y}
                                  r={point.label === audienceTrendChart.peakLabel ? 3.3 : 2.6}
                                  style={{ "--point-delay": `${220 + point.index * 36}ms` } as CSSProperties}
                                />
                              ))}
                            </svg>
                            <div className="dataset-overview-movement-chart__labels">
                              {audienceTrendChart.chartPoints.map((point) => (
                                <span
                                  key={point.label}
                                  className={point.label === audienceTrendChart.peakLabel ? "is-active" : ""}
                                >
                                  {point.shortLabel.toLowerCase()}
                                </span>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="dataset-overview-movement-chart dataset-overview-movement-chart--empty">
                            <span>activity trend unavailable in this saved dataset yet</span>
                          </div>
                        )}
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
                    <span className="dataset-overview-panel-title">audience movement</span>
                    <p className="dataset-overview-panel-subtitle">
                      summary across the selected export window
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
                            precision={typeof dataset.metrics?.reachNonFollowersPercent === "number" && dataset.metrics.reachNonFollowersPercent % 1 !== 0 ? 1 : 0}
                            fallback="--"
                            animateKey={`${motionKey}-reach-non-followers`}
                            reducedMotion={prefersReducedMotion}
                          />
                        </strong>
                      <span>non-followers</span>
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

              <article className="dataset-overview-support-card dataset-overview-support-card--interaction">
                <div className="dataset-overview-support-head">
                  <span className="dataset-overview-panel-title">interaction mix</span>
                    <strong className="dataset-overview-support-value">
                      <AnimatedValue
                        value={
                          (dataset.metrics?.postLikes ?? 0) +
                          (dataset.metrics?.postComments ?? 0) +
                          (dataset.metrics?.postSaves ?? 0)
                        }
                        variant="metric"
                        animateKey={`${motionKey}-interaction-total`}
                        reducedMotion={prefersReducedMotion}
                      />
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
                          <strong>
                            <AnimatedValue
                              value={item.value}
                              variant="metric"
                              animateKey={`${motionKey}-interaction-${item.key}`}
                              reducedMotion={prefersReducedMotion}
                            />
                          </strong>
                        </div>
                        <div className="dataset-overview-interaction-item__track" aria-hidden="true">
                          <div
                            className="dataset-overview-interaction-item__fill"
                            style={{ "--bar-width": barWidth } as CSSProperties}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </article>

              <article className="dataset-overview-support-card dataset-overview-support-card--details">
                <div className="dataset-overview-support-head">
                  <div className="dataset-overview-panel-copy">
                    <span className="dataset-overview-panel-title">dataset details</span>
                    <p className="dataset-overview-panel-subtitle">
                      saved metadata and import context for this workspace
                    </p>
                  </div>
                </div>
                <div className="dataset-overview-details-stack">
                  <div className="dataset-overview-details-row dataset-overview-details-row--paired">
                    <div className="dataset-overview-details-cell">
                      <span>dataset name</span>
                      <strong>{dataset.name}</strong>
                    </div>
                    <div className="dataset-overview-details-cell">
                      <span>imported on</span>
                      <strong>{formatDate(dataset.createdAt)}</strong>
                    </div>
                  </div>
                  <div className="dataset-overview-details-row">
                    <span>overview window</span>
                    <strong>{formatOverviewWindow(dataset.scope)}</strong>
                  </div>
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
                        <span>media quality</span>
                        <strong>{formatExportMediaQuality(dataset.scope)}</strong>
                      </div>
                    <div className="dataset-overview-details-cell">
                      <span>json files scanned</span>
                      <strong>{formatMetric(dataset.meta?.scannedJsonCount ?? null)}</strong>
                    </div>
                  </div>
                  <div className="dataset-overview-details-row">
                    <span>data detected</span>
                    {detectedDataBadges.length ? (
                      <div className="dataset-overview-details-badges">
                        {detectedDataBadges.map((badge) => (
                          <span key={badge} className="dataset-overview-details-badge">
                            {badge}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <strong>not detected</strong>
                    )}
                  </div>
                </div>
              </article>
            </div>
            </div>
          </div>
          )}
        </article>

        <aside className="dataset-side-panel dataset-side-panel--right dataset-dashboard-section dataset-dashboard-section--sidebar">
          <div className="dataset-side-panel__head">
            <p className="section-kicker">workspace</p>
          </div>

          <div className="dataset-side-panel__body">
            {isNotFollowingBackView ? (
              <div
                className="workspace-tool-pill workspace-tool-pill--featured workspace-tool-pill--current is-live"
                aria-label="Not following back tool is open"
              >
                <span className="workspace-tool-icon" aria-hidden="true">
                  <UserMinus size={16} strokeWidth={1.9} />
                </span>
                <span className="workspace-tool-copy">
                  <strong>not following back</strong>
                </span>
                <span className="workspace-tool-spacer" aria-hidden="true" />
              </div>
            ) : (
              <Link
                href={notFollowingBackHref}
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
            )}

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
