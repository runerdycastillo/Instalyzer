"use client";

import {
  Check,
  ChevronDown,
  CircleAlert,
  Clock3,
  Download,
  ExternalLink,
  RotateCcw,
  Search,
  SearchX,
  UserRoundX,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { LocalDatasetRecord } from "@/lib/instagram/local-datasets";
import {
  buildNotFollowingBackCsv,
  deriveNotFollowingBackEntries,
  sortNotFollowingBackEntries,
  type NotFollowingBackSortOrder,
} from "@/lib/instagram/not-following-back";
import {
  RECENT_PROFILE_VISIT_WINDOW_MS,
  pruneNotFollowingBackToolState,
  readNotFollowingBackToolState,
  writeNotFollowingBackToolState,
  type NotFollowingBackListKey,
  type NotFollowingBackToolState,
} from "@/lib/instagram/not-following-back-state";

type NotFollowingBackWorkspaceViewProps = {
  dataset: LocalDatasetRecord;
  onStorageStatusChange?: (message: string) => void;
};

type NotFollowingBackUnavailableState = {
  title: string;
  copy: string;
  checks: string[];
};

const ROW_EXIT_DURATION_MS = 220;
const CARD_HIGHLIGHT_DURATION_MS = 320;

function getCurrentTimestamp() {
  if (typeof performance !== "undefined" && Number.isFinite(performance.timeOrigin)) {
    return Math.round(performance.timeOrigin + performance.now());
  }

  return Date.now();
}

function getInteractionTimestamp(timeStamp: number) {
  if (
    typeof performance !== "undefined" &&
    Number.isFinite(performance.timeOrigin) &&
    Number.isFinite(timeStamp) &&
    timeStamp > 0
  ) {
    return Math.round(performance.timeOrigin + timeStamp);
  }

  return getCurrentTimestamp();
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

function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [delayMs, value]);

  return debouncedValue;
}

function AnimatedMetric({
  value,
  reducedMotion,
}: {
  value: number;
  reducedMotion: boolean;
}) {
  const [displayValue, setDisplayValue] = useState(value);
  const previousValueRef = useRef(value);

  useEffect(() => {
    const previousValue = previousValueRef.current;
    previousValueRef.current = value;

    if (reducedMotion || previousValue === value) {
      const frame = window.requestAnimationFrame(() => {
        setDisplayValue(value);
      });

      return () => {
        window.cancelAnimationFrame(frame);
      };
    }

    const startedAt = performance.now();
    const duration = 360;
    let frame = 0;

    const tick = (now: number) => {
      const progress = Math.min((now - startedAt) / duration, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const nextValue = previousValue + (value - previousValue) * easedProgress;
      setDisplayValue(nextValue);

      if (progress < 1) {
        frame = window.requestAnimationFrame(tick);
      }
    };

    frame = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [reducedMotion, value]);

  return <>{Math.round(displayValue).toLocaleString()}</>;
}

function PinToggleIcon({ filled }: { filled: boolean }) {
  if (filled) {
    return (
      <svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true">
        <path
          d="M12 17V22L10.9 21.45C10.24 21.12 10 20.9 10 20.5V17H6C5.45 17 5 16.55 5 16V15.24C5 14.48 5.43 13.78 6.11 13.45L7.89 12.55C8.57 12.22 9 11.52 9 10.76V7C9 6.45 8.55 6 8 6C6.9 6 6 5.1 6 4S6.9 2 8 2H16C17.1 2 18 2.9 18 4S17.1 6 16 6C15.45 6 15 6.45 15 7V10.76C15 11.52 15.43 12.22 16.11 12.55L17.89 13.45C18.57 13.78 19 14.48 19 15.24V16C19 16.55 18.55 17 18 17H12Z"
          fill="currentColor"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" aria-hidden="true">
      <path d="M12 17v5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path
        d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function formatMetric(value: number | null | undefined) {
  const number = Number(value);
  return Number.isFinite(number) ? number.toLocaleString() : "0";
}

function formatFollowedAt(timestamp: number) {
  if (!Number.isFinite(timestamp) || timestamp <= 0) {
    return "follow date unavailable";
  }

  return new Date(timestamp * 1000).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function buildExportFileName(datasetName: string, listKey: NotFollowingBackListKey) {
  const safeName =
    datasetName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "instagram-export";
  const safeListKey = listKey === "reviewLater" ? "review-later" : listKey === "notFound" ? "not-found" : listKey;

  return `${safeName}-not-following-back-${safeListKey}.csv`;
}

function getListMeta(listKey: NotFollowingBackListKey) {
  if (listKey === "pending") {
    return {
      label: "pending",
      description: "accounts still waiting for a decision",
    };
  }

  if (listKey === "unfollowed") {
    return {
      label: "unfollowed",
      description: "accounts you already marked done",
    };
  }

  if (listKey === "reviewLater") {
    return {
      label: "review later",
      description: "accounts set aside for another pass",
    };
  }

  return {
    label: "not found",
    description: "profiles that could not be reached",
  };
}

function getToneClassName(listKey: NotFollowingBackListKey) {
  if (listKey === "unfollowed") return "is-unfollowed";
  if (listKey === "reviewLater") return "is-review-later";
  if (listKey === "notFound") return "is-not-found";
  return "is-pending";
}

function getNotFollowingBackUnavailableState(dataset: LocalDatasetRecord): NotFollowingBackUnavailableState | null {
  const hasFollowerRecords = Array.isArray(dataset.records?.followers);
  const hasFollowingRecords = Array.isArray(dataset.records?.following);
  const exportRange = dataset.scope?.exportRequestRange || dataset.scope?.relationshipExportRange;

  if (!hasFollowerRecords || !hasFollowingRecords) {
    return {
      title: "relationship records missing",
      copy: "this saved dataset does not include the followers and following records needed for this tool.",
      checks: ["followers data", "following data"],
    };
  }

  if (dataset.scope?.notFollowingBackEligible === false || exportRange === "limited") {
    return {
      title: "all-time export needed",
      copy: "this tool needs an all-time instagram export before it can compare followers and following.",
      checks: ["all-time export", "json format"],
    };
  }

  return null;
}

function NotFollowingBackUnavailableStateView({
  dataset,
  state,
}: {
  dataset: LocalDatasetRecord;
  state: NotFollowingBackUnavailableState;
}) {
  return (
    <div className="relationship-tool relationship-tool--unavailable">
      <article className="relationship-tool__unavailable" aria-labelledby="not-following-back-unavailable-title">
        <span className="relationship-tool__unavailable-icon" aria-hidden="true">
          <UserRoundX size={22} strokeWidth={1.8} />
        </span>

        <div className="relationship-tool__unavailable-copy">
          <p className="section-kicker">tool unavailable</p>
          <h2 id="not-following-back-unavailable-title">{state.title}</h2>
          <p>{state.copy}</p>
        </div>

        <div className="relationship-tool__unavailable-checks" aria-label="Required data">
          {state.checks.map((check) => (
            <span key={check}>
              <CircleAlert size={13} strokeWidth={2} aria-hidden="true" />
              {check}
            </span>
          ))}
        </div>

        <div className="route-links relationship-tool__unavailable-actions">
          <Link href={`/app/datasets/${dataset.id}`} className="hero-btn hero-btn-secondary">
            overview
          </Link>
          <Link href="/app/datasets/new?entry=tool-unavailable" className="hero-btn hero-btn-primary">
            create dataset
          </Link>
        </div>
      </article>
    </div>
  );
}

export function NotFollowingBackWorkspaceView({
  dataset,
  onStorageStatusChange,
}: NotFollowingBackWorkspaceViewProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [visitClock, setVisitClock] = useState(() => getCurrentTimestamp());
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 160);
  const [sortOrder, setSortOrder] = useState<NotFollowingBackSortOrder>("latest");
  const [copiedUsername, setCopiedUsername] = useState("");
  const [downloadError, setDownloadError] = useState("");
  const [exitingRows, setExitingRows] = useState<Record<string, NotFollowingBackListKey>>({});
  const [highlightedCardKey, setHighlightedCardKey] = useState<NotFollowingBackListKey | null>(null);
  const [toolState, setToolState] = useState<NotFollowingBackToolState>(() =>
    readNotFollowingBackToolState(dataset.id),
  );
  const highlightTimeoutRef = useRef<number | null>(null);
  const rowExitTimeoutsRef = useRef<Record<string, number>>({});
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);
  const rowRefs = useRef<Record<string, HTMLLIElement | null>>({});
  const previousRowRectsRef = useRef<Map<string, DOMRect> | null>(null);
  const pendingListScrollTopRef = useRef<number | null>(null);
  const unavailableState = useMemo(() => getNotFollowingBackUnavailableState(dataset), [dataset]);
  const allEntries = useMemo(() => deriveNotFollowingBackEntries(dataset), [dataset]);
  const allUsernames = useMemo(() => allEntries.map((entry) => entry.username), [allEntries]);
  const prunedToolState = useMemo(
    () => pruneNotFollowingBackToolState(toolState, allUsernames, visitClock),
    [allUsernames, toolState, visitClock],
  );
  const activeList = prunedToolState.activeList;

  useEffect(() => {
    if (unavailableState) {
      const timeout = window.setTimeout(() => {
        onStorageStatusChange?.("");
      }, 0);

      return () => {
        window.clearTimeout(timeout);
      };
    }

    const didSave = writeNotFollowingBackToolState(dataset.id, prunedToolState);
    const timeout = window.setTimeout(() => {
      onStorageStatusChange?.(didSave ? "" : "changes are not saving");
    }, 0);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [dataset.id, onStorageStatusChange, prunedToolState, unavailableState]);

  useEffect(() => {
    const rowExitTimeouts = rowExitTimeoutsRef.current;

    return () => {
      if (highlightTimeoutRef.current) {
        window.clearTimeout(highlightTimeoutRef.current);
      }

      Object.values(rowExitTimeouts).forEach((timeout) => {
        window.clearTimeout(timeout);
      });
    };
  }, []);

  useEffect(() => {
    if (!copiedUsername) return undefined;

    const timeout = window.setTimeout(() => {
      setCopiedUsername("");
    }, 1400);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [copiedUsername]);

  useEffect(() => {
    function handleViewportChange() {
      const tooltipNode = tooltipRef.current;
      if (!tooltipNode) return;

      tooltipNode.className = "relationship-tool__floating-tooltip";
      tooltipNode.setAttribute("aria-hidden", "true");
    }

    window.addEventListener("scroll", handleViewportChange, true);
    window.addEventListener("resize", handleViewportChange);

    return () => {
      window.removeEventListener("scroll", handleViewportChange, true);
      window.removeEventListener("resize", handleViewportChange);
    };
  }, []);

  useEffect(() => {
    const visitTimestamps = Object.values(prunedToolState.recentVisits);
    if (!visitTimestamps.length) return undefined;

    const nextExpiry = Math.min(...visitTimestamps) + RECENT_PROFILE_VISIT_WINDOW_MS;
    const delay = Math.max(nextExpiry - getCurrentTimestamp(), 0) + 50;
    const timeout = window.setTimeout(() => {
      setVisitClock(getCurrentTimestamp());
    }, delay);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [prunedToolState.recentVisits]);

  const unfollowedSet = useMemo(() => new Set(prunedToolState.unfollowed), [prunedToolState.unfollowed]);
  const reviewLaterSet = useMemo(() => new Set(prunedToolState.reviewLater), [prunedToolState.reviewLater]);
  const notFoundSet = useMemo(() => new Set(prunedToolState.notFound), [prunedToolState.notFound]);
  const pinnedSet = useMemo(() => new Set(prunedToolState.pinned), [prunedToolState.pinned]);
  const recentVisitSet = useMemo(
    () => new Set(Object.keys(prunedToolState.recentVisits)),
    [prunedToolState.recentVisits],
  );

  const listEntries = useMemo(() => {
    return {
      pending: allEntries.filter(
        (entry) =>
          !unfollowedSet.has(entry.username) &&
          !reviewLaterSet.has(entry.username) &&
          !notFoundSet.has(entry.username),
      ),
      unfollowed: allEntries.filter((entry) => unfollowedSet.has(entry.username)),
      reviewLater: allEntries.filter((entry) => reviewLaterSet.has(entry.username)),
      notFound: allEntries.filter((entry) => notFoundSet.has(entry.username)),
    };
  }, [allEntries, notFoundSet, reviewLaterSet, unfollowedSet]);

  const listMeta = getListMeta(activeList);
  const activeToneClassName = getToneClassName(activeList);
  const visibleEntries = useMemo(() => {
    const normalizedQuery = debouncedQuery.trim().toLowerCase();
    const queryFilteredEntries = normalizedQuery
      ? listEntries[activeList].filter((entry) => entry.username.includes(normalizedQuery))
      : listEntries[activeList];
    const sortedEntries = sortNotFollowingBackEntries(queryFilteredEntries, sortOrder);

    if (activeList !== "pending") {
      return sortedEntries;
    }

    const pinnedEntries = sortedEntries.filter((entry) => pinnedSet.has(entry.username));
    const unpinnedEntries = sortedEntries.filter((entry) => !pinnedSet.has(entry.username));
    return [...pinnedEntries, ...unpinnedEntries];
  }, [activeList, debouncedQuery, listEntries, pinnedSet, sortOrder]);

  useLayoutEffect(() => {
    const previousRowRects = previousRowRectsRef.current;
    if (!previousRowRects) return;

    previousRowRectsRef.current = null;

    const listNode = listRef.current;
    if (listNode && pendingListScrollTopRef.current !== null) {
      listNode.scrollTop = pendingListScrollTopRef.current;
    }
    pendingListScrollTopRef.current = null;

    if (prefersReducedMotion) return;

    Object.entries(rowRefs.current).forEach(([username, rowNode]) => {
      if (!rowNode) return;

      const previousRect = previousRowRects.get(username);
      if (!previousRect) return;

      const nextRect = rowNode.getBoundingClientRect();
      const deltaX = previousRect.left - nextRect.left;
      const deltaY = previousRect.top - nextRect.top;

      if (Math.abs(deltaX) < 1 && Math.abs(deltaY) < 1) return;

      rowNode.animate(
        [
          { transform: `translate(${deltaX}px, ${deltaY}px)` },
          { transform: "translate(0, 0)" },
        ],
        {
          duration: 320,
          easing: "cubic-bezier(0.22, 1, 0.36, 1)",
        },
      );
    });
  }, [prefersReducedMotion, visibleEntries]);

  const hasActiveSearch = debouncedQuery.trim().length > 0;
  const hasFlaggedAccounts = allEntries.length > 0;
  const emptyTitle = hasActiveSearch
    ? `no ${listMeta.label} matches for that search`
    : hasFlaggedAccounts
      ? `nothing in ${listMeta.label}`
      : "no accounts need review";
  const emptyDescription = hasActiveSearch
    ? "try a different username search or sort order."
    : hasFlaggedAccounts
      ? activeList === "pending"
        ? "this dataset does not currently show any flagged accounts waiting for review."
        : `move accounts into ${listMeta.label} to keep the cleanup flow organized.`
      : "";

  function setActiveList(nextList: NotFollowingBackListKey) {
    setToolState((current) => ({
      ...current,
      activeList: nextList,
    }));
  }

  function commitMoveUser(
    username: string,
    nextList: NotFollowingBackListKey,
    recentActivityAt?: number,
  ) {
    setToolState((current) => {
      const normalizedUsername = username.trim().toLowerCase();
      const nextState = {
        ...current,
        unfollowed: current.unfollowed.filter((item) => item !== normalizedUsername),
        reviewLater: current.reviewLater.filter((item) => item !== normalizedUsername),
        notFound: current.notFound.filter((item) => item !== normalizedUsername),
        pinned: current.pinned.filter((item) => item !== normalizedUsername),
        recentVisits: Object.fromEntries(
          Object.entries(current.recentVisits).filter(([item]) => item !== normalizedUsername),
        ),
      };

      if (nextList === "unfollowed") {
        nextState.unfollowed = [normalizedUsername, ...nextState.unfollowed];
      }

      if (nextList === "reviewLater") {
        nextState.reviewLater = [normalizedUsername, ...nextState.reviewLater];
      }

      if (nextList === "notFound") {
        nextState.notFound = [normalizedUsername, ...nextState.notFound];
      }

      if (current.activeList !== "pending" && !nextState[current.activeList].length) {
        nextState.activeList = "pending";
      }

      if (recentActivityAt) {
        nextState.recentVisits = {
          ...nextState.recentVisits,
          [normalizedUsername]: recentActivityAt,
        };
      }

      return nextState;
    });
  }

  function highlightSummaryCard(nextList: NotFollowingBackListKey) {
    setHighlightedCardKey(nextList);
    if (highlightTimeoutRef.current) {
      window.clearTimeout(highlightTimeoutRef.current);
    }

    highlightTimeoutRef.current = window.setTimeout(() => {
      setHighlightedCardKey((current) => (current === nextList ? null : current));
    }, CARD_HIGHLIGHT_DURATION_MS);
  }

  function moveUser(username: string, nextList: NotFollowingBackListKey, recentActivityAt: number) {
    const normalizedUsername = username.trim().toLowerCase();
    if (!normalizedUsername) return;
    if (rowExitTimeoutsRef.current[normalizedUsername]) return;

    if (prefersReducedMotion) {
      commitMoveUser(normalizedUsername, nextList, recentActivityAt);
      highlightSummaryCard(nextList);
      return;
    }

    setExitingRows((current) => ({
      ...current,
      [normalizedUsername]: nextList,
    }));

    rowExitTimeoutsRef.current[normalizedUsername] = window.setTimeout(() => {
      commitMoveUser(normalizedUsername, nextList, recentActivityAt);
      highlightSummaryCard(nextList);
      setExitingRows((current) => {
        const nextRows = { ...current };
        delete nextRows[normalizedUsername];
        return nextRows;
      });
      delete rowExitTimeoutsRef.current[normalizedUsername];
    }, ROW_EXIT_DURATION_MS);
  }

  function captureRowLayoutForReorder() {
    const previousRects = new Map<string, DOMRect>();

    Object.entries(rowRefs.current).forEach(([username, rowNode]) => {
      if (rowNode) {
        previousRects.set(username, rowNode.getBoundingClientRect());
      }
    });

    previousRowRectsRef.current = previousRects.size ? previousRects : null;
    pendingListScrollTopRef.current = listRef.current?.scrollTop ?? null;
  }

  function togglePinned(username: string) {
    const normalizedUsername = username.trim().toLowerCase();
    if (!normalizedUsername) return;

    if (activeList === "pending") {
      captureRowLayoutForReorder();
    }

    setToolState((current) => {
      const nextPinned = current.pinned.filter((item) => item !== normalizedUsername);
      const isPinned = nextPinned.length !== current.pinned.length;

      return {
        ...current,
        pinned: isPinned ? nextPinned : [normalizedUsername, ...nextPinned],
      };
    });
  }

  function recordProfileVisit(username: string, visitedAt: number) {
    const normalizedUsername = username.trim().toLowerCase();
    if (!normalizedUsername) return;

    setVisitClock(visitedAt);
    setToolState((current) => ({
      ...current,
      recentVisits: {
        ...current.recentVisits,
        [normalizedUsername]: visitedAt,
      },
    }));
  }

  function downloadCsv() {
    try {
      setDownloadError("");
      const csv = buildNotFollowingBackCsv(visibleEntries);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = buildExportFileName(dataset.name, activeList);
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      setDownloadError("download failed");
    }
  }

  async function copyHandle(username: string) {
    try {
      await navigator.clipboard.writeText(`@${username}`);
      setCopiedUsername(username);
    } catch {
      setCopiedUsername("");
    }
  }

  function showTooltip(label: string, target: HTMLElement) {
    const tooltipNode = tooltipRef.current;
    if (!tooltipNode) return;

    const rect = target.getBoundingClientRect();
    const placement = rect.top > 64 ? "top" : "bottom";

    tooltipNode.textContent = label;
    tooltipNode.style.left = `${rect.left + rect.width / 2}px`;
    tooltipNode.style.top = `${placement === "top" ? rect.top - 8 : rect.bottom + 8}px`;
    tooltipNode.className = `relationship-tool__floating-tooltip is-visible relationship-tool__floating-tooltip--${placement}`;
    tooltipNode.setAttribute("aria-hidden", "false");
  }

  function hideTooltip() {
    const tooltipNode = tooltipRef.current;
    if (!tooltipNode) return;

    tooltipNode.className = "relationship-tool__floating-tooltip";
    tooltipNode.setAttribute("aria-hidden", "true");
  }

  const summaryCards = [
    {
      key: "pending" as const,
      label: "pending",
      value: listEntries.pending.length,
      note: "accounts left to review",
      Icon: UserRoundX,
      accentClassName: "is-pending",
    },
    {
      key: "unfollowed" as const,
      label: "unfollowed",
      value: listEntries.unfollowed.length,
      note: "accounts marked done",
      Icon: Check,
      accentClassName: "is-unfollowed",
    },
    {
      key: "reviewLater" as const,
      label: "review later",
      value: listEntries.reviewLater.length,
      note: "saved for a later pass",
      Icon: Clock3,
      accentClassName: "is-review-later",
    },
    {
      key: "notFound" as const,
      label: "not found",
      value: listEntries.notFound.length,
      note: "profiles not reached",
      Icon: SearchX,
      accentClassName: "is-not-found",
    },
  ];
  const activeSummaryCard = summaryCards.find((card) => card.key === activeList) || summaryCards[0];
  const ActiveEmptyIcon = activeSummaryCard.Icon;

  if (unavailableState) {
    return <NotFollowingBackUnavailableStateView dataset={dataset} state={unavailableState} />;
  }

  return (
    <div className="relationship-tool">
      <div className="relationship-tool__summary-grid">
        {summaryCards.map((card) => {
          const Icon = card.Icon;
          const isActive = activeList === card.key;
          const isHighlighted = highlightedCardKey === card.key;

          return (
            <button
              key={card.key}
              type="button"
              className={`relationship-tool__summary-card ${card.accentClassName}${isActive ? " is-active" : ""}${isHighlighted ? " is-highlighted" : ""}`}
              onClick={() => setActiveList(card.key)}
            >
              <span className="relationship-tool__summary-head">
                <span>{card.label}</span>
                <i aria-hidden="true">
                  <Icon size={15} strokeWidth={1.9} />
                </i>
              </span>
              <strong>
                <AnimatedMetric value={card.value} reducedMotion={prefersReducedMotion} />
              </strong>
              <small>{card.note}</small>
            </button>
          );
        })}
      </div>

      <p className="relationship-tool__context">
        compared <strong>{formatMetric(dataset.metrics?.followerCount)}</strong> followers against{" "}
        <strong>{formatMetric(dataset.metrics?.followingCount)}</strong> following.
      </p>

      <div className="relationship-tool__toolbar">
        <label className="relationship-tool__search">
          <Search size={15} aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={`search ${listMeta.label}`}
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
          />
        </label>

        <div className="relationship-tool__toolbar-actions">
          <label className="relationship-tool__sort">
            <span>sort</span>
            <div className="relationship-tool__sort-control">
              <select
                value={sortOrder}
                onChange={(event) => setSortOrder(event.target.value as NotFollowingBackSortOrder)}
              >
                <option value="latest">latest</option>
                <option value="earliest">earliest</option>
                <option value="az">a to z</option>
                <option value="za">z to a</option>
              </select>
              <ChevronDown size={18} aria-hidden="true" />
            </div>
          </label>

          <span className="relationship-tool__download-wrap">
            <button
              type="button"
              className="hero-btn hero-btn-secondary relationship-tool__button relationship-tool__button--icon"
              onClick={downloadCsv}
              disabled={!visibleEntries.length}
              aria-label="download csv"
              title="download csv"
            >
              <Download size={18} aria-hidden="true" />
            </button>
            {downloadError ? (
              <span
                className="relationship-tool__toolbar-error"
                role="alert"
                aria-label={downloadError}
                title={downloadError}
              >
                <CircleAlert size={14} strokeWidth={2.1} aria-hidden="true" />
              </span>
            ) : null}
          </span>
        </div>
      </div>

      <div className="relationship-tool__note-row">
        <p>
          <strong className={`relationship-tool__note-tone ${activeToneClassName}`}>
            {hasFlaggedAccounts ? listMeta.label : "all clear"}
          </strong>:{" "}
          {hasFlaggedAccounts ? listMeta.description : "no accounts need review in this export"}.
        </p>
        <p className="relationship-tool__result-count">
          <strong>{visibleEntries.length.toLocaleString()}</strong> result{visibleEntries.length === 1 ? "" : "s"}
        </p>
      </div>

      <div className="relationship-tool__list-shell">
        {visibleEntries.length ? (
          <ul
            className="relationship-tool__list"
            ref={listRef}
            aria-label={`Not following back ${listMeta.label} list`}
          >
            {visibleEntries.map((entry) => {
              const isPinned = activeList === "pending" && pinnedSet.has(entry.username);
              const isExiting = Boolean(exitingRows[entry.username]);

              return (
              <li
                key={entry.username}
                ref={(node) => {
                  if (node) {
                    rowRefs.current[entry.username] = node;
                  } else {
                    delete rowRefs.current[entry.username];
                  }
                }}
                className={`relationship-tool__row${recentVisitSet.has(entry.username) ? " is-recently-visited" : ""}${isPinned ? " is-pinned" : ""}${isExiting ? " is-exiting" : ""}`}
              >
                <div className="relationship-tool__row-main">
                  {activeList === "pending" ? (
                      <button
                        type="button"
                        className="relationship-tool__action relationship-tool__action--primary relationship-tool__action--icon relationship-tool__action--unfollowed"
                        onClick={(event) =>
                          moveUser(entry.username, "unfollowed", getInteractionTimestamp(event.timeStamp))
                        }
                        disabled={isExiting}
                        aria-label={`Mark @${entry.username} unfollowed`}
                        title="mark unfollowed"
                    >
                      <Check size={15} aria-hidden="true" />
                    </button>
                  ) : activeList !== "unfollowed" ? (
                      <button
                        type="button"
                        className="relationship-tool__action relationship-tool__action--primary relationship-tool__action--icon relationship-tool__action--unfollowed"
                        onClick={(event) =>
                          moveUser(entry.username, "unfollowed", getInteractionTimestamp(event.timeStamp))
                        }
                        disabled={isExiting}
                        aria-label={`Mark @${entry.username} unfollowed`}
                        title="mark unfollowed"
                    >
                      <Check size={15} aria-hidden="true" />
                    </button>
                  ) : (
                      <button
                        type="button"
                        className="relationship-tool__action relationship-tool__action--icon relationship-tool__action--pending"
                        onClick={(event) =>
                          moveUser(entry.username, "pending", getInteractionTimestamp(event.timeStamp))
                        }
                        disabled={isExiting}
                        aria-label={`Move @${entry.username} to pending`}
                        title="move to pending"
                    >
                      <RotateCcw size={14} aria-hidden="true" />
                    </button>
                  )}

                  <div className="relationship-tool__row-copy">
                    <div className="relationship-tool__row-title">
                      <button
                        type="button"
                        className="relationship-tool__handle"
                        onClick={() => copyHandle(entry.username)}
                        aria-label={`Copy @${entry.username}`}
                        title={copiedUsername === entry.username ? "copied" : "copy"}
                      >
                        @{entry.username}
                      </button>
                      {activeList === "pending" ? (
                        <button
                          type="button"
                          className={`relationship-tool__pin-toggle${isPinned ? " is-pinned" : ""}`}
                          onClick={() => togglePinned(entry.username)}
                          disabled={isExiting}
                          aria-label={`${isPinned ? "Unpin" : "Pin"} @${entry.username}`}
                        >
                          <PinToggleIcon filled={isPinned} />
                        </button>
                      ) : null}
                    </div>
                    <p>{formatFollowedAt(entry.timestamp)}</p>
                  </div>
                </div>

                <div className="relationship-tool__row-actions">
                  {activeList === "pending" ? (
                    <>
                      <button
                        type="button"
                        className="relationship-tool__action relationship-tool__action--icon relationship-tool__action--review-later"
                        onClick={(event) =>
                          moveUser(entry.username, "reviewLater", getInteractionTimestamp(event.timeStamp))
                        }
                        disabled={isExiting}
                        onMouseEnter={(event) => showTooltip("review later", event.currentTarget)}
                        onMouseLeave={hideTooltip}
                        onFocus={(event) => showTooltip("review later", event.currentTarget)}
                        onBlur={hideTooltip}
                        aria-label={`Move @${entry.username} to review later`}
                      >
                        <Clock3 size={15} aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        className="relationship-tool__action relationship-tool__action--icon relationship-tool__action--not-found"
                        onClick={(event) =>
                          moveUser(entry.username, "notFound", getInteractionTimestamp(event.timeStamp))
                        }
                        disabled={isExiting}
                        onMouseEnter={(event) => showTooltip("not found", event.currentTarget)}
                        onMouseLeave={hideTooltip}
                        onFocus={(event) => showTooltip("not found", event.currentTarget)}
                        onBlur={hideTooltip}
                        aria-label={`Mark @${entry.username} as not found`}
                      >
                        <UserRoundX size={15} aria-hidden="true" />
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      className="relationship-tool__action relationship-tool__action--icon relationship-tool__action--pending"
                      onClick={(event) =>
                        moveUser(entry.username, "pending", getInteractionTimestamp(event.timeStamp))
                      }
                      disabled={isExiting}
                      aria-label={`Move @${entry.username} to pending`}
                      title="move to pending"
                    >
                      <RotateCcw size={14} aria-hidden="true" />
                    </button>
                  )}
                  <a
                    href={entry.href}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="relationship-tool__action relationship-tool__action--icon"
                    aria-disabled={isExiting}
                    onClick={(event) => {
                      if (isExiting) {
                        event.preventDefault();
                        return;
                      }

                      recordProfileVisit(entry.username, getInteractionTimestamp(event.timeStamp));
                    }}
                    onMouseEnter={(event) => showTooltip("open profile", event.currentTarget)}
                    onMouseLeave={hideTooltip}
                    onFocus={(event) => showTooltip("open profile", event.currentTarget)}
                    onBlur={hideTooltip}
                    aria-label={`Open @${entry.username}`}
                  >
                    <ExternalLink size={14} aria-hidden="true" />
                  </a>
                </div>
              </li>
            )})}
          </ul>
        ) : (
          <div className="relationship-tool__empty">
            <span className={`relationship-tool__empty-icon ${activeToneClassName}`} aria-hidden="true">
              <ActiveEmptyIcon size={22} strokeWidth={1.9} />
            </span>
            <strong>{emptyTitle}</strong>
            {emptyDescription ? <p>{emptyDescription}</p> : null}
            {hasActiveSearch ? (
              <button
                type="button"
                className="relationship-tool__empty-action"
                onClick={() => setQuery("")}
              >
                clear search
              </button>
            ) : null}
            {!hasActiveSearch && !hasFlaggedAccounts ? (
              <Link href={`/app/datasets/${dataset.id}`} className="relationship-tool__empty-action">
                overview
              </Link>
            ) : null}
          </div>
        )}
      </div>

      {typeof document !== "undefined"
        ? createPortal(
            <div
              ref={tooltipRef}
              className="relationship-tool__floating-tooltip"
              role="tooltip"
              aria-hidden="true"
            />,
            document.body,
          )
        : null}
    </div>
  );
}
