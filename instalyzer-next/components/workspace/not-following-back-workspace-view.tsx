"use client";

import { Check, Clock3, Download, ExternalLink, RotateCcw, Search, UserMinus, UserRoundX } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
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
};

type FloatingTooltipState = {
  label: string;
  x: number;
  y: number;
  placement: "top" | "bottom";
};

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

export function NotFollowingBackWorkspaceView({
  dataset,
}: NotFollowingBackWorkspaceViewProps) {
  const [visitClock, setVisitClock] = useState(() => Date.now());
  const [query, setQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<NotFollowingBackSortOrder>("latest");
  const [copiedUsername, setCopiedUsername] = useState("");
  const [tooltip, setTooltip] = useState<FloatingTooltipState | null>(null);
  const [toolState, setToolState] = useState<NotFollowingBackToolState>(() =>
    readNotFollowingBackToolState(dataset.id),
  );
  const allEntries = useMemo(() => deriveNotFollowingBackEntries(dataset), [dataset]);
  const allUsernames = useMemo(() => allEntries.map((entry) => entry.username), [allEntries]);
  const prunedToolState = useMemo(
    () => pruneNotFollowingBackToolState(toolState, allUsernames, visitClock),
    [allUsernames, toolState, visitClock],
  );

  useEffect(() => {
    writeNotFollowingBackToolState(dataset.id, prunedToolState);
  }, [dataset.id, prunedToolState]);

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
    if (!tooltip) return undefined;

    function handleViewportChange() {
      setTooltip(null);
    }

    window.addEventListener("scroll", handleViewportChange, true);
    window.addEventListener("resize", handleViewportChange);

    return () => {
      window.removeEventListener("scroll", handleViewportChange, true);
      window.removeEventListener("resize", handleViewportChange);
    };
  }, [tooltip]);

  useEffect(() => {
    const visitTimestamps = Object.values(prunedToolState.recentVisits);
    if (!visitTimestamps.length) return undefined;

    const nextExpiry = Math.min(...visitTimestamps) + RECENT_PROFILE_VISIT_WINDOW_MS;
    const delay = Math.max(nextExpiry - Date.now(), 0) + 50;
    const timeout = window.setTimeout(() => {
      setVisitClock(Date.now());
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

  const activeList = prunedToolState.activeList;
  const listMeta = getListMeta(activeList);
  const activeToneClassName = getToneClassName(activeList);
  const visibleEntries = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
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
  }, [activeList, listEntries, pinnedSet, query, sortOrder]);

  function setActiveList(nextList: NotFollowingBackListKey) {
    setToolState((current) => ({
      ...current,
      activeList: nextList,
    }));
  }

  function moveUser(username: string, nextList: NotFollowingBackListKey) {
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

      return nextState;
    });
  }

  function togglePinned(username: string) {
    const normalizedUsername = username.trim().toLowerCase();
    if (!normalizedUsername) return;

    setToolState((current) => {
      const nextPinned = current.pinned.filter((item) => item !== normalizedUsername);
      const isPinned = nextPinned.length !== current.pinned.length;

      return {
        ...current,
        pinned: isPinned ? nextPinned : [normalizedUsername, ...nextPinned],
      };
    });
  }

  function recordProfileVisit(username: string) {
    const normalizedUsername = username.trim().toLowerCase();
    if (!normalizedUsername) return;

    const visitedAt = Date.now();
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
    const rect = target.getBoundingClientRect();
    const placement = rect.top > 64 ? "top" : "bottom";

    setTooltip({
      label,
      x: rect.left + rect.width / 2,
      y: placement === "top" ? rect.top - 8 : rect.bottom + 8,
      placement,
    });
  }

  function hideTooltip() {
    setTooltip(null);
  }

  const summaryCards = [
    {
      key: "pending" as const,
      label: "pending",
      value: listEntries.pending.length,
      note: "accounts left to review",
      Icon: UserMinus,
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
      Icon: UserRoundX,
      accentClassName: "is-not-found",
    },
  ];

  return (
    <div className="relationship-tool">
      <div className="relationship-tool__summary-grid">
        {summaryCards.map((card) => {
          const Icon = card.Icon;
          const isActive = activeList === card.key;

          return (
            <button
              key={card.key}
              type="button"
              className={`relationship-tool__summary-card ${card.accentClassName}${isActive ? " is-active" : ""}`}
              onClick={() => setActiveList(card.key)}
            >
              <span className="relationship-tool__summary-head">
                <span>{card.label}</span>
                <i aria-hidden="true">
                  <Icon size={15} strokeWidth={1.9} />
                </i>
              </span>
              <strong>{formatMetric(card.value)}</strong>
              <small>{card.note}</small>
            </button>
          );
        })}
      </div>

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
            <select
              value={sortOrder}
              onChange={(event) => setSortOrder(event.target.value as NotFollowingBackSortOrder)}
            >
              <option value="latest">latest followed</option>
              <option value="earliest">earliest followed</option>
              <option value="az">a-z</option>
              <option value="za">z-a</option>
            </select>
          </label>

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
        </div>
      </div>

      <div className="relationship-tool__note-row">
        <p>
          Compared <strong>{formatMetric(dataset.metrics?.followerCount)}</strong> followers against{" "}
          <strong>{formatMetric(dataset.metrics?.followingCount)}</strong> following.
        </p>
        <p>
          <strong>{listMeta.label}</strong>: {listMeta.description}. Showing{" "}
          <strong>{visibleEntries.length.toLocaleString()}</strong> result{visibleEntries.length === 1 ? "" : "s"}.
        </p>
      </div>

      <div className="relationship-tool__list-shell">
        {visibleEntries.length ? (
          <ul className="relationship-tool__list" aria-label={`Not following back ${listMeta.label} list`}>
            {visibleEntries.map((entry) => {
              const isPinned = activeList === "pending" && pinnedSet.has(entry.username);

              return (
              <li
                key={entry.username}
                className={`relationship-tool__row${recentVisitSet.has(entry.username) ? " is-recently-visited" : ""}${isPinned ? " is-pinned" : ""}`}
              >
                <div className="relationship-tool__row-main">
                  {activeList === "pending" ? (
                    <button
                      type="button"
                      className="relationship-tool__action relationship-tool__action--primary relationship-tool__action--icon"
                      onClick={() => moveUser(entry.username, "unfollowed")}
                      aria-label={`Mark @${entry.username} unfollowed`}
                      title="mark unfollowed"
                    >
                      <Check size={15} aria-hidden="true" />
                    </button>
                  ) : activeList !== "unfollowed" ? (
                    <button
                      type="button"
                      className="relationship-tool__action relationship-tool__action--primary relationship-tool__action--icon"
                      onClick={() => moveUser(entry.username, "unfollowed")}
                      aria-label={`Mark @${entry.username} unfollowed`}
                      title="mark unfollowed"
                    >
                      <Check size={15} aria-hidden="true" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="relationship-tool__action relationship-tool__action--icon"
                      onClick={() => moveUser(entry.username, "pending")}
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
                        title={copiedUsername === entry.username ? "copied" : "copy handle"}
                      >
                        @{entry.username}
                      </button>
                      <span className={`relationship-tool__row-badge ${activeToneClassName}`}>{listMeta.label}</span>
                      {activeList === "pending" ? (
                        <button
                          type="button"
                          className={`relationship-tool__pin-toggle${isPinned ? " is-pinned" : ""}`}
                          onClick={() => togglePinned(entry.username)}
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
                        className="relationship-tool__action relationship-tool__action--icon"
                        onClick={() => moveUser(entry.username, "reviewLater")}
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
                        className="relationship-tool__action relationship-tool__action--icon"
                        onClick={() => moveUser(entry.username, "notFound")}
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
                      className="relationship-tool__action relationship-tool__action--icon"
                      onClick={() => moveUser(entry.username, "pending")}
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
                    onClick={() => recordProfileVisit(entry.username)}
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
            <strong>{query.trim() ? `no ${listMeta.label} matches for that search` : `nothing in ${listMeta.label}`}</strong>
            <p>
              {query.trim()
                ? "try a different username search or sort order."
                : activeList === "pending"
                  ? "this dataset does not currently show any flagged accounts waiting for review."
                  : `move accounts into ${listMeta.label} to keep the cleanup flow organized.`}
            </p>
          </div>
        )}
      </div>

      {tooltip && typeof document !== "undefined"
        ? createPortal(
            <div
              className={`relationship-tool__floating-tooltip relationship-tool__floating-tooltip--${tooltip.placement}`}
              style={{
                left: tooltip.x,
                top: tooltip.y,
              }}
              role="tooltip"
            >
              {tooltip.label}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
