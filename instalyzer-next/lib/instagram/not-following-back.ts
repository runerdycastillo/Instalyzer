import type { LocalDatasetRecord } from "@/lib/instagram/local-datasets";

export type NotFollowingBackEntry = {
  username: string;
  href: string;
  timestamp: number;
};

export type NotFollowingBackSortOrder = "latest" | "earliest" | "az" | "za";

function normalizeUsername(value: string) {
  return String(value || "").trim().trimStart("@").toLowerCase();
}

export function getInstagramProfileHref(username: string, href = "") {
  if (href) return href;
  const normalizedUsername = normalizeUsername(username);
  return normalizedUsername ? `https://www.instagram.com/${normalizedUsername}/` : "";
}

export function deriveNotFollowingBackEntries(dataset: LocalDatasetRecord): NotFollowingBackEntry[] {
  const followers = dataset.records?.followers || [];
  const following = dataset.records?.following || [];
  const followerLookup = new Set(followers.map((entry) => normalizeUsername(entry.username)));
  const latestFollowingByUsername = new Map<string, NotFollowingBackEntry>();

  for (const entry of following) {
    const username = normalizeUsername(entry.username);
    if (!username) continue;

    const candidate = {
      username,
      href: getInstagramProfileHref(username, entry.href),
      timestamp: Number.isFinite(entry.timestamp) ? entry.timestamp : 0,
    };

    const existing = latestFollowingByUsername.get(username);
    if (!existing || candidate.timestamp > existing.timestamp) {
      latestFollowingByUsername.set(username, candidate);
    }
  }

  return [...latestFollowingByUsername.values()].filter((entry) => !followerLookup.has(entry.username));
}

export function sortNotFollowingBackEntries(
  entries: NotFollowingBackEntry[],
  sortOrder: NotFollowingBackSortOrder,
) {
  const sortedEntries = [...entries];

  if (sortOrder === "az" || sortOrder === "za") {
    sortedEntries.sort((left, right) => left.username.localeCompare(right.username));
    return sortOrder === "za" ? sortedEntries.reverse() : sortedEntries;
  }

  sortedEntries.sort((left, right) => {
    if (left.timestamp === right.timestamp) {
      return left.username.localeCompare(right.username);
    }

    return sortOrder === "earliest" ? left.timestamp - right.timestamp : right.timestamp - left.timestamp;
  });

  return sortedEntries;
}

export function buildNotFollowingBackCsv(entries: NotFollowingBackEntry[]) {
  const rows = [
    ["username", "profile_url", "followed_at"],
    ...entries.map((entry) => [
      entry.username,
      getInstagramProfileHref(entry.username, entry.href),
      entry.timestamp ? new Date(entry.timestamp * 1000).toISOString() : "",
    ]),
  ];

  return rows
    .map((row) =>
      row
        .map((value) => {
          const text = String(value ?? "");
          return /[",\n]/.test(text) ? `"${text.replace(/"/g, "\"\"")}"` : text;
        })
        .join(","),
    )
    .join("\n");
}
