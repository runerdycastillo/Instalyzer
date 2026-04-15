export type NotFollowingBackListKey = "pending" | "unfollowed" | "reviewLater" | "notFound";

export type NotFollowingBackToolState = {
  activeList: NotFollowingBackListKey;
  unfollowed: string[];
  reviewLater: string[];
  notFound: string[];
  pinned: string[];
  recentVisits: Record<string, number>;
};

const STORAGE_KEY_PREFIX = "instalyzer_next_not_following_back_tool_v1";
export const RECENT_PROFILE_VISIT_WINDOW_MS = 30 * 1000;

function normalizeUsername(value: string) {
  return String(value || "").trim().trimStart("@").toLowerCase();
}

function getStorageKey(datasetId: string) {
  return `${STORAGE_KEY_PREFIX}:${datasetId}`;
}

export function getDefaultNotFollowingBackToolState(): NotFollowingBackToolState {
  return {
    activeList: "pending",
    unfollowed: [],
    reviewLater: [],
    notFound: [],
    pinned: [],
    recentVisits: {},
  };
}

export function readNotFollowingBackToolState(datasetId: string): NotFollowingBackToolState {
  if (typeof window === "undefined") {
    return getDefaultNotFollowingBackToolState();
  }

  try {
    const raw = window.localStorage.getItem(getStorageKey(datasetId));
    if (!raw) {
      return getDefaultNotFollowingBackToolState();
    }

    const parsed = JSON.parse(raw) as Partial<NotFollowingBackToolState> | null;
    return {
      activeList:
        parsed?.activeList === "unfollowed" ||
        parsed?.activeList === "reviewLater" ||
        parsed?.activeList === "notFound"
          ? parsed.activeList
          : "pending",
      unfollowed: Array.isArray(parsed?.unfollowed) ? parsed.unfollowed.map(normalizeUsername).filter(Boolean) : [],
      reviewLater: Array.isArray(parsed?.reviewLater)
        ? parsed.reviewLater.map(normalizeUsername).filter(Boolean)
        : [],
      notFound: Array.isArray(parsed?.notFound) ? parsed.notFound.map(normalizeUsername).filter(Boolean) : [],
      pinned: Array.isArray(parsed?.pinned) ? parsed.pinned.map(normalizeUsername).filter(Boolean) : [],
      recentVisits: readRecentVisits(parsed?.recentVisits),
    };
  } catch {
    return getDefaultNotFollowingBackToolState();
  }
}

export function writeNotFollowingBackToolState(datasetId: string, state: NotFollowingBackToolState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(getStorageKey(datasetId), JSON.stringify(state));
}

export function pruneNotFollowingBackToolState(
  state: NotFollowingBackToolState,
  validUsernames: string[],
  now = Date.now(),
): NotFollowingBackToolState {
  const validLookup = new Set(validUsernames.map(normalizeUsername));
  const seen = new Set<string>();

  const keepUnique = (items: string[]) =>
    items
      .map(normalizeUsername)
      .filter((username) => {
        if (!username || !validLookup.has(username) || seen.has(username)) {
          return false;
        }

        seen.add(username);
        return true;
      });

  const unfollowed = keepUnique(state.unfollowed);
  const reviewLater = keepUnique(state.reviewLater);
  const notFound = keepUnique(state.notFound);
  const pendingBlocked = new Set([...unfollowed, ...reviewLater, ...notFound]);
  const pinnedSeen = new Set<string>();

  return {
    activeList: state.activeList,
    unfollowed,
    reviewLater,
    notFound,
    pinned: state.pinned
      .map(normalizeUsername)
      .filter((username) => {
        if (!username || !validLookup.has(username) || pendingBlocked.has(username) || pinnedSeen.has(username)) {
          return false;
        }

        pinnedSeen.add(username);
        return true;
      }),
    recentVisits: Object.fromEntries(
      Object.entries(state.recentVisits || {})
        .map(([username, timestamp]) => [normalizeUsername(username), Number(timestamp)] as const)
        .filter(
          ([username, timestamp]) =>
            username &&
            validLookup.has(username) &&
            Number.isFinite(timestamp) &&
            timestamp > 0 &&
            now - timestamp <= RECENT_PROFILE_VISIT_WINDOW_MS,
        ),
    ),
  };
}

function readRecentVisits(value: unknown) {
  if (!value || typeof value !== "object") {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value)
      .map(([username, timestamp]) => [normalizeUsername(username), Number(timestamp)] as const)
      .filter(([, timestamp]) => Number.isFinite(timestamp) && timestamp > 0),
  );
}
