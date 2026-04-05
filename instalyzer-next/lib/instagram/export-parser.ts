"use client";

export type DatasetEntryPoint =
  | "home-hero"
  | "home-results-preview"
  | "home-pricing-free"
  | "home-pricing-basic"
  | "home-pricing-premium"
  | "home-final-cta"
  | "help-cta"
  | "workspace-shell"
  | "datasets-index"
  | "app-home"
  | "unknown";

export type DatasetCategory =
  | "followers"
  | "following"
  | "profile"
  | "audience-insights"
  | "reach-insights"
  | "interaction-insights"
  | "zip-archive"
  | "other-json";

export type DatasetToolId =
  | "not-following-back"
  | "audience-insights"
  | "reach-summary"
  | "content-interactions";

export type DatasetToolStatus = "ready" | "partial" | "later";

export type DatasetToolAvailability = {
  id: DatasetToolId;
  title: string;
  status: DatasetToolStatus;
  note: string;
};

export type DatasetImportReview = {
  sourceLabel: string;
  fileCount: number;
  fileNames: string[];
  categoryLabels: string[];
  categoryCount: number;
  tools: DatasetToolAvailability[];
  uploadSummary: string;
  readinessNote: string;
};

export type DatasetRelationshipRecord = {
  username: string;
  href: string;
  timestamp: number;
  source: "followers" | "following";
};

export type DatasetProfile = {
  username: string;
  displayName: string;
  bio: string;
  website: string;
  isPrivate: boolean;
  profilePhotoPath: string;
  profilePhotoCreatedAt: number;
};

export type DatasetScope = {
  insightDateRangeLabel: string;
  relationshipExportRange: "all_time" | "limited" | "unknown";
  notFollowingBackEligible: boolean;
};

export type DatasetMetrics = {
  followerCount: number;
  followingCount: number;
  mutualCount: number;
  notFollowingBackCount: number;
  followerTotalFromInsights: number | null;
  accountsReached: number | null;
  impressions: number | null;
  profileVisits: number | null;
  externalLinkTaps: number | null;
  contentInteractions: number | null;
  accountsEngaged: number | null;
  postInteractions: number | null;
  storyInteractions: number | null;
  storyReplies: number | null;
  followsInRange: number | null;
  unfollowsInRange: number | null;
  netFollowersInRange: number | null;
};

export type DatasetMeta = {
  followersFiles: Array<{ path: string; count: number }>;
  followingFiles: Array<{ path: string; count: number }>;
  followerEntryCount: number;
  followingEntryCount: number;
  sourceLabel: string;
  detectedDataLabel: string;
  scannedJsonCount: number;
  ignoredJsonCount: number;
  categoryCounts: Array<[string, number]>;
};

export type PreparedLocalDatasetDraft = {
  importReview: DatasetImportReview;
  profile: DatasetProfile | null;
  scope: DatasetScope;
  metrics: DatasetMetrics;
  meta: DatasetMeta;
  records: {
    followers: DatasetRelationshipRecord[];
    following: DatasetRelationshipRecord[];
  };
};

type ImportFileLike = {
  name: string;
  webkitRelativePath?: string;
  text(): Promise<string>;
};

type ParsedRelationshipMatch = {
  type: "followers" | "following";
  entries: unknown[];
  path: string;
};

type ParsedAudienceInsights = {
  followerTotal: number | null;
  followsInRange: number | null;
  unfollowsInRange: number | null;
  netFollowersInRange: number | null;
  dateRangeLabel: string;
};

type ParsedReachInsights = {
  accountsReached: number | null;
  impressions: number | null;
  profileVisits: number | null;
  externalLinkTaps: number | null;
  dateRangeLabel: string;
};

type ParsedInteractionInsights = {
  contentInteractions: number | null;
  postInteractions: number | null;
  storyInteractions: number | null;
  storyReplies: number | null;
  accountsEngaged: number | null;
  dateRangeLabel: string;
};

declare global {
  interface Window {
    fflate?: {
      unzipSync(data: Uint8Array): Record<string, Uint8Array>;
      strFromU8(data: Uint8Array): string;
    };
  }
}

let fflateLoaderPromise: Promise<NonNullable<Window["fflate"]>> | null = null;

const categoryLabels: Record<DatasetCategory, string> = {
  followers: "followers",
  following: "following",
  profile: "profile identity",
  "audience-insights": "audience insights",
  "reach-insights": "reach summary",
  "interaction-insights": "content interactions",
  "zip-archive": "zip archive",
  "other-json": "other json",
};

function getFilePath(file: Pick<ImportFileLike, "name" | "webkitRelativePath">) {
  return (file.webkitRelativePath || file.name || "").replaceAll("\\", "/").toLowerCase();
}

function normalizeUploadPath(file: Pick<ImportFileLike, "name" | "webkitRelativePath">) {
  return (file.webkitRelativePath || file.name || "").replaceAll("\\", "/");
}

function normalizePathForMatch(file: Pick<ImportFileLike, "name" | "webkitRelativePath">) {
  return normalizeUploadPath(file).toLowerCase();
}

function detectCategory(file: Pick<ImportFileLike, "name" | "webkitRelativePath">): DatasetCategory {
  const path = getFilePath(file);

  if (path.endsWith(".zip")) return "zip-archive";
  if (/followers_?\d*\.json$/i.test(path)) return "followers";
  if (/following\.json$/i.test(path)) return "following";
  if (/personal_information\/personal_information\/personal_information\.json$/i.test(path)) {
    return "profile";
  }
  if (/audience_insights\.json$/i.test(path)) return "audience-insights";
  if (/profiles_reached\.json$/i.test(path)) return "reach-insights";
  if (/content_interactions\.json$/i.test(path)) return "interaction-insights";
  if (path.endsWith(".json")) return "other-json";
  return "other-json";
}

function getSourceLabel(files: File[]) {
  const zipCount = files.filter((file) => file.name.toLowerCase().endsWith(".zip")).length;
  const hasFolderPaths = files.some((file) => Boolean(file.webkitRelativePath));

  if (zipCount > 0) {
    return zipCount === 1 ? "ZIP archive" : "ZIP archives";
  }

  if (hasFolderPaths) {
    return "Folder import";
  }

  return "Selected files";
}

function loadFflateScript() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("ZIP support is only available in the browser."));
  }

  if (window.fflate?.unzipSync && window.fflate?.strFromU8) {
    return Promise.resolve(window.fflate);
  }

  if (fflateLoaderPromise) {
    return fflateLoaderPromise;
  }

  fflateLoaderPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[data-instalyzer-fflate="true"]',
    );

    const handleReady = () => {
      if (window.fflate?.unzipSync && window.fflate?.strFromU8) {
        resolve(window.fflate);
        return;
      }

      fflateLoaderPromise = null;
      reject(new Error("ZIP support failed to initialize."));
    };

    const handleError = () => {
      fflateLoaderPromise = null;
      reject(new Error("ZIP support could not be loaded."));
    };

    if (existingScript) {
      existingScript.addEventListener("load", handleReady, { once: true });
      existingScript.addEventListener("error", handleError, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "/vendor-fflate.js";
    script.async = true;
    script.dataset.instalyzerFflate = "true";
    script.addEventListener("load", handleReady, { once: true });
    script.addEventListener("error", handleError, { once: true });
    document.head.appendChild(script);
  });

  return fflateLoaderPromise;
}

function normalizeRangeLabel(value: string) {
  return String(value || "").trim().replace(/\s+/g, " ");
}

function detectRelationshipExportRange(rangeLabel: string) {
  const normalized = normalizeRangeLabel(rangeLabel).toLowerCase();
  if (!normalized) return "unknown";
  if (/\ball\s*time\b/.test(normalized)) return "all_time";
  return "limited";
}

function getNotFollowingBackAccess(rangeLabel: string) {
  const detectedRange = detectRelationshipExportRange(rangeLabel);

  if (detectedRange === "all_time") {
    return {
      eligible: true,
      note: "All-time export detected, so relationship results can use the broadest roster available.",
    };
  }

  if (detectedRange === "limited") {
    return {
      eligible: false,
      note: `This dataset shows "${normalizeRangeLabel(rangeLabel)}". Re-export in JSON with all time for the strongest relationship results.`,
    };
  }

  return {
    eligible: false,
    note: "All-time export was not verified for this dataset yet.",
  };
}

function getReadinessNote(
  hasRelationshipFiles: boolean,
  rangeLabel: string,
  hasInsightMetrics: boolean,
) {
  if (hasRelationshipFiles) {
    const relationshipAccess = getNotFollowingBackAccess(rangeLabel);
    if (relationshipAccess.eligible) {
      return "Relationship records and overview signals were detected, so this dataset is ready for a strong workspace handoff.";
    }

    if (hasInsightMetrics) {
      return "Your overview signals are ready now, but relationship tools will be strongest after an all-time JSON export.";
    }

    return "Relationship records were detected, but an all-time JSON export is still recommended for the strongest tool accuracy.";
  }

  return "This import is missing the core followers and following records needed for the launch relationship workflow.";
}

function getToolAvailability(input: {
  hasFollowers: boolean;
  hasFollowing: boolean;
  relationshipEligible: boolean;
  hasAudienceInsights: boolean;
  hasReachInsights: boolean;
  hasInteractionInsights: boolean;
}): DatasetToolAvailability[] {
  const hasRelationshipFiles = input.hasFollowers && input.hasFollowing;

  return [
    {
      id: "not-following-back",
      title: "Not Following Back",
      status: hasRelationshipFiles
        ? input.relationshipEligible
          ? "ready"
          : "partial"
        : "later",
      note: hasRelationshipFiles
        ? input.relationshipEligible
          ? "Followers and following records were detected with an all-time relationship range."
          : "Followers and following were detected, but the export range still needs verification for the strongest results."
        : "Needs both followers and following records.",
    },
    {
      id: "audience-insights",
      title: "Audience Insights",
      status: input.hasAudienceInsights ? "ready" : "later",
      note: input.hasAudienceInsights
        ? "Audience insight summary files were detected."
        : "Needs audience insight summary files.",
    },
    {
      id: "reach-summary",
      title: "Reach Summary",
      status: input.hasReachInsights ? "ready" : "later",
      note: input.hasReachInsights
        ? "Reach summary files were detected."
        : "Needs reach summary files.",
    },
    {
      id: "content-interactions",
      title: "Content Interactions",
      status: input.hasInteractionInsights ? "ready" : "later",
      note: input.hasInteractionInsights
        ? "Interaction summary files were detected."
        : "Needs content interaction files.",
    },
  ];
}

function summarizeDetectedCategories(categoryCounts: Map<string, number>) {
  const ranked = [...categoryCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([label]) => label);

  if (!ranked.length) return "followers and following";
  if (ranked.length <= 4) return ranked.join(", ");

  const visible = ranked.slice(0, 4);
  const remaining = ranked.length - visible.length;
  return `${visible.join(", ")}, +${remaining} more`;
}

function detectImportCategory(file: Pick<ImportFileLike, "name" | "webkitRelativePath">) {
  const path = normalizePathForMatch(file);

  if (/(^|\/)connections\//.test(path)) return "connections";
  if (/(^|\/)logged_information\/past_instagram_insights\//.test(path)) return "insights";
  if (/(^|\/)personal_information\//.test(path)) return "personal information";
  if (/(^|\/)your_instagram_activity\//.test(path)) return "instagram activity";
  if (/(^|\/)ads_information\//.test(path)) return "ads information";
  if (/(^|\/)account_based_in\//.test(path)) return "account settings";
  return "other";
}

function createCategoryCounts(files: ImportFileLike[]) {
  const counts = new Map<string, number>();

  for (const file of files) {
    const category = detectImportCategory(file);
    counts.set(category, (counts.get(category) || 0) + 1);
  }

  return counts;
}

function extractEntries(data: unknown, key: string) {
  if (Array.isArray(data)) return data;
  if (
    typeof data === "object" &&
    data &&
    key in data &&
    Array.isArray((data as Record<string, unknown>)[key])
  ) {
    return (data as Record<string, unknown[]>)[key];
  }
  return [];
}

function isFollowersFile(file: Pick<ImportFileLike, "name" | "webkitRelativePath">) {
  return /(^|\/)connections\/followers_and_following\/followers_?\d*\.json$/i.test(
    normalizePathForMatch(file),
  );
}

function isFollowingFile(file: Pick<ImportFileLike, "name" | "webkitRelativePath">) {
  return /(^|\/)connections\/followers_and_following\/following\.json$/i.test(
    normalizePathForMatch(file),
  );
}

function classifyInstagramJson(data: unknown, file: Pick<ImportFileLike, "name" | "webkitRelativePath">) {
  const followersEntries = extractEntries(data, "relationships_followers");
  if (isFollowersFile(file) && followersEntries.length > 0) {
    return {
      type: "followers" as const,
      entries: followersEntries,
      path: normalizeUploadPath(file),
    };
  }

  const followingEntries = extractEntries(data, "relationships_following");
  if (isFollowingFile(file) && followingEntries.length > 0) {
    return {
      type: "following" as const,
      entries: followingEntries,
      path: normalizeUploadPath(file),
    };
  }

  return null;
}

function getStringMapValue(entry: unknown, key: string) {
  if (!entry || typeof entry !== "object") return "";
  const stringMap = (entry as Record<string, unknown>).string_map_data;
  if (!stringMap || typeof stringMap !== "object") return "";
  const raw = (stringMap as Record<string, unknown>)[key];
  if (!raw || typeof raw !== "object") return "";
  return String((raw as Record<string, unknown>).value || "").trim();
}

function getMediaMapEntry(entry: unknown, key: string) {
  if (!entry || typeof entry !== "object") return null;
  const mediaMap = (entry as Record<string, unknown>).media_map_data;
  if (!mediaMap || typeof mediaMap !== "object") return null;
  return ((mediaMap as Record<string, unknown>)[key] as Record<string, unknown>) || null;
}

function getFirstArrayItem(data: unknown, key: string) {
  const entries = extractEntries(data, key);
  return entries[0] || null;
}

function normalizeUsername(value: string) {
  return String(value || "").trim().replace(/^@/, "").toLowerCase();
}

function looksCorruptedProfileText(value: string) {
  const text = String(value || "").trim();
  if (!text) return false;
  return /Ã|â|ð|�/.test(text);
}

function repairCorruptedUtf8Text(value: string) {
  const text = String(value || "").trim();
  if (!text) return "";

  try {
    const bytes = Uint8Array.from([...text].map((char) => char.charCodeAt(0) & 0xff));
    return new TextDecoder("utf-8", { fatal: false }).decode(bytes).trim();
  } catch {
    return text;
  }
}

function normalizeDisplayNameText(value: string) {
  const original = String(value || "").trim();
  if (!original) return "";

  const repaired = looksCorruptedProfileText(original) ? repairCorruptedUtf8Text(original) : original;
  const normalized = repaired.normalize("NFKD");
  const withoutMarks = normalized.replace(/\p{M}+/gu, "");
  return withoutMarks.replace(/[^\p{L}\p{N} .'-]+/gu, " ").replace(/\s+/g, " ").trim();
}
function extractProfileFromPersonalInfo(data: unknown): DatasetProfile | null {
  const profileEntry = getFirstArrayItem(data, "profile_user");
  if (!profileEntry) return null;

  const photo = getMediaMapEntry(profileEntry, "Profile Photo");

  return {
    username: normalizeUsername(getStringMapValue(profileEntry, "Username")),
    displayName: normalizeDisplayNameText(getStringMapValue(profileEntry, "Name")),
    bio: getStringMapValue(profileEntry, "Bio"),
    website: getStringMapValue(profileEntry, "Website"),
    isPrivate: getStringMapValue(profileEntry, "Private Account").toLowerCase() === "true",
    profilePhotoPath: String(photo?.uri || "").trim(),
    profilePhotoCreatedAt: Number(photo?.creation_timestamp || 0) || 0,
  };
}

function extractInsightDateRange(data: unknown) {
  if (!data || typeof data !== "object") return "";

  for (const value of Object.values(data)) {
    if (!Array.isArray(value)) continue;
    for (const entry of value) {
      const label = getStringMapValue(entry, "Date Range");
      if (label) return label;
    }
  }

  return "";
}

function parseInsightCount(value: string) {
  const digits = String(value || "").replace(/[^\d-]/g, "");
  if (!digits) return null;
  const number = Number(digits);
  return Number.isFinite(number) ? number : null;
}

function extractAudienceInsights(data: unknown): ParsedAudienceInsights | null {
  const entry = getFirstArrayItem(data, "organic_insights_audience");
  if (!entry) return null;

  return {
    followerTotal: parseInsightCount(getStringMapValue(entry, "Followers")),
    followsInRange: parseInsightCount(getStringMapValue(entry, "Follows")),
    unfollowsInRange: parseInsightCount(getStringMapValue(entry, "Unfollows")),
    netFollowersInRange: parseInsightCount(getStringMapValue(entry, "Overall followers")),
    dateRangeLabel: getStringMapValue(entry, "Date Range"),
  };
}

function extractReachInsights(data: unknown): ParsedReachInsights | null {
  const entry = getFirstArrayItem(data, "organic_insights_reach");
  if (!entry) return null;

  return {
    accountsReached: parseInsightCount(getStringMapValue(entry, "Accounts reached")),
    impressions: parseInsightCount(getStringMapValue(entry, "Impressions")),
    profileVisits: parseInsightCount(getStringMapValue(entry, "Profile visits")),
    externalLinkTaps: parseInsightCount(getStringMapValue(entry, "External link taps")),
    dateRangeLabel: getStringMapValue(entry, "Date Range"),
  };
}

function extractInteractionInsights(data: unknown): ParsedInteractionInsights | null {
  const entry = getFirstArrayItem(data, "organic_insights_interactions");
  if (!entry) return null;

  return {
    contentInteractions: parseInsightCount(getStringMapValue(entry, "Content interactions")),
    postInteractions: parseInsightCount(getStringMapValue(entry, "Post interactions")),
    storyInteractions: parseInsightCount(getStringMapValue(entry, "Story interactions")),
    storyReplies: parseInsightCount(getStringMapValue(entry, "Story replies")),
    accountsEngaged: parseInsightCount(getStringMapValue(entry, "Accounts engaged")),
    dateRangeLabel: getStringMapValue(entry, "Date Range"),
  };
}

function extractUsernameFromHref(href: string) {
  if (!href) return "";

  try {
    const url = new URL(href);
    const segments = url.pathname.split("/").filter(Boolean);
    if (!segments.length) return "";
    if (segments[0] === "_u" && segments[1]) return normalizeUsername(segments[1]);
    return normalizeUsername(segments[0]);
  } catch {
    const match = String(href).match(/instagram\.com\/(?:_u\/)?([^/?#]+)/i);
    return normalizeUsername(match?.[1] || "");
  }
}

function extractRelationshipUsername(entry: unknown) {
  if (!entry || typeof entry !== "object") return "";
  const record = entry as Record<string, unknown>;
  const title = normalizeUsername(String(record.title || ""));
  if (title) return title;
  const first = (record.string_list_data as Array<Record<string, unknown>> | undefined)?.[0] || {};
  const value = normalizeUsername(String(first.value || ""));
  if (value) return value;
  return extractUsernameFromHref(String(first.href || ""));
}

function extractRelationshipTimestamp(entry: unknown) {
  if (!entry || typeof entry !== "object") return 0;
  const first =
    ((entry as Record<string, unknown>).string_list_data as Array<Record<string, unknown>> | undefined)?.[0] ||
    {};
  const timestamp = Number(first.timestamp || 0);
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function createRelationshipRecords(
  entries: unknown[],
  source: "followers" | "following",
): DatasetRelationshipRecord[] {
  const records: DatasetRelationshipRecord[] = [];
  const seen = new Set<string>();

  for (const entry of entries) {
    const username = extractRelationshipUsername(entry);
    if (!username || seen.has(username)) continue;
    seen.add(username);

    const first =
      ((entry as Record<string, unknown>).string_list_data as Array<Record<string, unknown>> | undefined)?.[0] ||
      {};

    records.push({
      username,
      href: String(first.href || ""),
      timestamp: extractRelationshipTimestamp(entry),
      source,
    });
  }

  return records;
}

function buildRelationshipMetrics(
  followers: DatasetRelationshipRecord[],
  following: DatasetRelationshipRecord[],
) {
  const followerSet = new Set(followers.map((entry) => entry.username));
  const followingSet = new Set(following.map((entry) => entry.username));

  let mutualCount = 0;
  let notFollowingBackCount = 0;

  for (const username of followingSet) {
    if (followerSet.has(username)) {
      mutualCount += 1;
    } else {
      notFollowingBackCount += 1;
    }
  }

  return {
    followerCount: followers.length,
    followingCount: following.length,
    mutualCount,
    notFollowingBackCount,
  };
}

async function extractZipJsonFiles(file: File): Promise<ImportFileLike[]> {
  const fflate = await loadFflateScript();
  if (!fflate?.unzipSync || !fflate?.strFromU8) {
    throw new Error("ZIP support is unavailable right now.");
  }

  const archive = fflate.unzipSync(new Uint8Array(await file.arrayBuffer()));
  const extracted: ImportFileLike[] = [];

  for (const [path, bytes] of Object.entries(archive)) {
    if (!/\.json$/i.test(path)) continue;
    extracted.push({
      name: path.split("/").pop() || path,
      webkitRelativePath: `${file.name}/${path}`,
      text: async () => fflate.strFromU8(bytes),
    });
  }

  return extracted;
}

async function expandImportedFiles(files: File[]): Promise<ImportFileLike[]> {
  const expandedFiles: ImportFileLike[] = [];

  for (const file of files) {
    if (file.name.toLowerCase().endsWith(".zip")) {
      expandedFiles.push(...(await extractZipJsonFiles(file)));
    } else {
      expandedFiles.push(file);
    }
  }

  return expandedFiles.filter((file) => /\.json$/i.test(file.name));
}

export function getDefaultDatasetName(
  profile: DatasetProfile | null,
  selectedFiles: File[],
) {
  const username = profile?.username || "";
  if (username) {
    return `${username} instagram export`;
  }

  if (selectedFiles.length === 1) {
    const filename = selectedFiles[0].name.replace(/\.[^.]+$/, "");
    if (filename) return filename.replace(/[-_]+/g, " ");
  }

  return "instagram export";
}
export async function prepareDatasetDraft(files: File[]): Promise<PreparedLocalDatasetDraft> {
  const sourceLabel = getSourceLabel(files);
  const categorySet = new Set<DatasetCategory>();
  files.forEach((file) => categorySet.add(detectCategory(file)));

  const expandedJsonFiles = await expandImportedFiles(files);
  if (!expandedJsonFiles.length) {
    throw new Error("No JSON files were found. Upload the Instagram ZIP or the extracted JSON export.");
  }

  const categoryCounts = createCategoryCounts(expandedJsonFiles);
  const detectedDataLabel = summarizeDetectedCategories(categoryCounts);
  const followerMatches: ParsedRelationshipMatch[] = [];
  const followingMatches: ParsedRelationshipMatch[] = [];
  let ignoredJsonCount = 0;
  let profile: DatasetProfile | null = null;
  let insightDateRangeLabel = "";
  let audienceInsights: ParsedAudienceInsights | null = null;
  let reachInsights: ParsedReachInsights | null = null;
  let interactionInsights: ParsedInteractionInsights | null = null;

  for (const file of expandedJsonFiles) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(await file.text());
    } catch {
      continue;
    }

    if (
      !profile &&
      /(^|\/)personal_information\/personal_information\/personal_information\.json$/i.test(
        normalizePathForMatch(file),
      )
    ) {
      profile = extractProfileFromPersonalInfo(parsed);
      categorySet.add("profile");
      continue;
    }

    if (
      !audienceInsights &&
      /(^|\/)logged_information\/past_instagram_insights\/audience_insights\.json$/i.test(
        normalizePathForMatch(file),
      )
    ) {
      audienceInsights = extractAudienceInsights(parsed);
      categorySet.add("audience-insights");
      if (!insightDateRangeLabel && audienceInsights?.dateRangeLabel) {
        insightDateRangeLabel = audienceInsights.dateRangeLabel;
      }
    }

    if (
      !reachInsights &&
      /(^|\/)logged_information\/past_instagram_insights\/profiles_reached\.json$/i.test(
        normalizePathForMatch(file),
      )
    ) {
      reachInsights = extractReachInsights(parsed);
      categorySet.add("reach-insights");
      if (!insightDateRangeLabel && reachInsights?.dateRangeLabel) {
        insightDateRangeLabel = reachInsights.dateRangeLabel;
      }
    }

    if (
      !interactionInsights &&
      /(^|\/)logged_information\/past_instagram_insights\/content_interactions\.json$/i.test(
        normalizePathForMatch(file),
      )
    ) {
      interactionInsights = extractInteractionInsights(parsed);
      categorySet.add("interaction-insights");
      if (!insightDateRangeLabel && interactionInsights?.dateRangeLabel) {
        insightDateRangeLabel = interactionInsights.dateRangeLabel;
      }
    }

    if (!insightDateRangeLabel) {
      insightDateRangeLabel = extractInsightDateRange(parsed);
    }

    const classified = classifyInstagramJson(parsed, file);
    if (!classified) {
      ignoredJsonCount += 1;
      continue;
    }

    if (classified.type === "followers") {
      followerMatches.push(classified);
      categorySet.add("followers");
    }

    if (classified.type === "following") {
      followingMatches.push(classified);
      categorySet.add("following");
    }
  }

  if (!followerMatches.length || !followingMatches.length) {
    const missing = [
      followerMatches.length ? null : "followers",
      followingMatches.length ? null : "following",
    ]
      .filter(Boolean)
      .join(" and ");

    throw new Error(
      `Could not find the required ${missing} JSON. Make sure you selected the Instagram export in JSON format.`,
    );
  }

  const followers = createRelationshipRecords(
    followerMatches.flatMap((match) => match.entries),
    "followers",
  );
  const following = createRelationshipRecords(
    followingMatches.flatMap((match) => match.entries),
    "following",
  );
  const relationshipMetrics = buildRelationshipMetrics(followers, following);
  const relationshipAccess = getNotFollowingBackAccess(insightDateRangeLabel);

  const metrics: DatasetMetrics = {
    ...relationshipMetrics,
    followerTotalFromInsights: audienceInsights?.followerTotal ?? null,
    accountsReached: reachInsights?.accountsReached ?? null,
    impressions: reachInsights?.impressions ?? null,
    profileVisits: reachInsights?.profileVisits ?? null,
    externalLinkTaps: reachInsights?.externalLinkTaps ?? null,
    contentInteractions: interactionInsights?.contentInteractions ?? null,
    accountsEngaged: interactionInsights?.accountsEngaged ?? null,
    postInteractions: interactionInsights?.postInteractions ?? null,
    storyInteractions: interactionInsights?.storyInteractions ?? null,
    storyReplies: interactionInsights?.storyReplies ?? null,
    followsInRange: audienceInsights?.followsInRange ?? null,
    unfollowsInRange: audienceInsights?.unfollowsInRange ?? null,
    netFollowersInRange: audienceInsights?.netFollowersInRange ?? null,
  };

  const hasInsightMetrics =
    metrics.followerTotalFromInsights !== null ||
    metrics.accountsReached !== null ||
    metrics.profileVisits !== null ||
    metrics.contentInteractions !== null;

  const tools = getToolAvailability({
    hasFollowers: followers.length > 0,
    hasFollowing: following.length > 0,
    relationshipEligible: relationshipAccess.eligible,
    hasAudienceInsights: audienceInsights !== null,
    hasReachInsights: reachInsights !== null,
    hasInteractionInsights: interactionInsights !== null,
  });

  const categoryLabelsList = Array.from(categorySet).map((category) => categoryLabels[category]);
  const uploadSummary =
    files.length === 1
      ? `${files[0].name} is staged and ready to analyze.`
      : `${files.length} files are staged and ready to analyze.`;

  return {
    importReview: {
      sourceLabel,
      fileCount: files.length,
      fileNames: files.map((file) => file.webkitRelativePath || file.name),
      categoryLabels: categoryLabelsList,
      categoryCount: categoryLabelsList.length,
      tools,
      uploadSummary,
      readinessNote: getReadinessNote(true, insightDateRangeLabel, hasInsightMetrics),
    },
    profile,
    scope: {
      insightDateRangeLabel,
      relationshipExportRange: detectRelationshipExportRange(insightDateRangeLabel),
      notFollowingBackEligible: relationshipAccess.eligible,
    },
    metrics,
    meta: {
      followersFiles: followerMatches.map((match) => ({
        path: match.path,
        count: match.entries.length,
      })),
      followingFiles: followingMatches.map((match) => ({
        path: match.path,
        count: match.entries.length,
      })),
      followerEntryCount: followers.length,
      followingEntryCount: following.length,
      sourceLabel,
      detectedDataLabel,
      scannedJsonCount: expandedJsonFiles.length,
      ignoredJsonCount,
      categoryCounts: [...categoryCounts.entries()],
    },
    records: {
      followers,
      following,
    },
  };
}
