export type NotFollowingBackListKey = "pending" | "unfollowed" | "reviewLater" | "notFound";

export type NotFollowingBackToolState = {
  activeList: NotFollowingBackListKey;
  unfollowed: string[];
  reviewLater: string[];
  notFound: string[];
};

const STORAGE_KEY_PREFIX = "instalyzer_next_not_following_back_tool_v1";

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

  return {
    activeList: state.activeList,
    unfollowed: keepUnique(state.unfollowed),
    reviewLater: keepUnique(state.reviewLater),
    notFound: keepUnique(state.notFound),
  };
}
