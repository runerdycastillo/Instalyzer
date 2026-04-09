"use client";

import { REQUIRED_EXPORT_SETTINGS_TEXT } from "@/lib/instagram/export-requirements";

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
  profilePhotoDataUrl?: string;
  profilePhotoCreatedAt: number;
};

export type DatasetScope = {
  insightDateRangeLabel: string;
  relationshipExportRange: "all_time" | "limited" | "unknown";
  exportRequestRange: "all_time" | "limited" | "unknown";
  exportRequestStartTimestamp: number | null;
  exportRequestEndTimestamp: number | null;
  exportRequestFormat: string;
  exportRequestMediaQuality: string;
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
  reachFollowersPercent: number | null;
  reachNonFollowersPercent: number | null;
  topFollowerCity: string;
  topFollowerCityPercent: number | null;
  topFollowerCountry: string;
  topFollowerCountryPercent: number | null;
  menFollowerPercent: number | null;
  womenFollowerPercent: number | null;
  followerActivityByDay: Array<{
    label: string;
    shortLabel: string;
    value: number | null;
  }>;
  topFollowerActivityDay: string;
  topFollowerActivityValue: number | null;
  postLikes: number | null;
  postComments: number | null;
  postSaves: number | null;
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

type ExpandedImportData = {
  jsonFiles: ImportFileLike[];
  archiveEntries: Map<string, { bytes: Uint8Array; mimeType: string }>;
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
  topFollowerCity: string;
  topFollowerCityPercent: number | null;
  topFollowerCountry: string;
  topFollowerCountryPercent: number | null;
  menFollowerPercent: number | null;
  womenFollowerPercent: number | null;
  followerActivityByDay: Array<{
    label: string;
    shortLabel: string;
    value: number | null;
  }>;
  topFollowerActivityDay: string;
  topFollowerActivityValue: number | null;
  dateRangeLabel: string;
};

type ParsedReachInsights = {
  accountsReached: number | null;
  impressions: number | null;
  profileVisits: number | null;
  externalLinkTaps: number | null;
  reachFollowersPercent: number | null;
  reachNonFollowersPercent: number | null;
  dateRangeLabel: string;
};

type ParsedInteractionInsights = {
  contentInteractions: number | null;
  postInteractions: number | null;
  storyInteractions: number | null;
  storyReplies: number | null;
  accountsEngaged: number | null;
  postLikes: number | null;
  postComments: number | null;
  postSaves: number | null;
  dateRangeLabel: string;
};

type ParsedDownloadRequest = {
  requestTimestamp: number;
  startTimestamp: number | null;
  endTimestamp: number | null;
  outputFormat: string;
  mediaQuality: string;
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

const requiredLaunchDataLabels = [
  "profile identity",
  "followers",
  "following",
  "audience insights",
  "reach summary",
  "content interactions",
] as const;

function getFilePath(file: Pick<ImportFileLike, "name" | "webkitRelativePath">) {
  return (file.webkitRelativePath || file.name || "").replaceAll("\\", "/").toLowerCase();
}

function normalizeUploadPath(file: Pick<ImportFileLike, "name" | "webkitRelativePath">) {
  return (file.webkitRelativePath || file.name || "").replaceAll("\\", "/");
}

function normalizePathForMatch(file: Pick<ImportFileLike, "name" | "webkitRelativePath">) {
  return normalizeUploadPath(file).toLowerCase();
}

function normalizeArchivePath(path: string) {
  return String(path || "").replaceAll("\\", "/").replace(/^\/+/, "").toLowerCase();
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

function getMimeTypeFromPath(path: string) {
  const normalized = normalizeArchivePath(path);
  if (normalized.endsWith(".jpg") || normalized.endsWith(".jpeg")) return "image/jpeg";
  if (normalized.endsWith(".png")) return "image/png";
  if (normalized.endsWith(".webp")) return "image/webp";
  if (normalized.endsWith(".gif")) return "image/gif";
  return "";
}

function encodeBase64(bytes: Uint8Array) {
  let binary = "";
  const chunkSize = 0x8000;

  for (let index = 0; index < bytes.length; index += chunkSize) {
    const chunk = bytes.subarray(index, index + chunkSize);
    binary += String.fromCharCode(...chunk);
  }

  return btoa(binary);
}

function createDataUrlFromBytes(bytes: Uint8Array, mimeType: string) {
  return `data:${mimeType};base64,${encodeBase64(bytes)}`;
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

function formatLabelList(values: string[]) {
  if (values.length <= 1) return values[0] || "";
  if (values.length === 2) return `${values[0]} and ${values[1]}`;
  return `${values.slice(0, -1).join(", ")}, and ${values[values.length - 1]}`;
}

function getRequiredLaunchSettingsMessage(detail: string) {
  return `this export doesn't meet the required launch settings yet. ${detail} required settings: ${REQUIRED_EXPORT_SETTINGS_TEXT} re-export from instagram and try again.`;
}

function detectExportRequestRange(startTimestamp: number | null) {
  if (startTimestamp === null || !Number.isFinite(startTimestamp)) return "unknown";
  if (startTimestamp < 0) return "all_time";
  return "limited";
}

function getNotFollowingBackAccess(input: {
  rangeLabel: string;
  exportRequestRange: "all_time" | "limited" | "unknown";
}) {
  const detectedRange = input.exportRequestRange;

  if (detectedRange === "all_time") {
    return {
      eligible: true,
      note: "all-time export request verified, so relationship results can use the broadest roster available.",
    };
  }

  if (detectedRange === "limited") {
    return {
      eligible: false,
      note: "the export request history shows a limited date range, so re-export with all time before using relationship tools.",
    };
  }

  if (normalizeRangeLabel(input.rangeLabel)) {
    return {
      eligible: true,
      note: `insight range detected as "${normalizeRangeLabel(input.rangeLabel)}". relationship records were loaded successfully for this dataset.`,
    };
  }

  return {
    eligible: true,
    note: "relationship records were loaded successfully for this dataset.",
  };
}

function getLabelValueEntry(entry: unknown, label: string) {
  if (!entry || typeof entry !== "object") return null;
  const labelValues = (entry as Record<string, unknown>).label_values;
  if (!Array.isArray(labelValues)) return null;

  return (
    labelValues.find((item) => item && typeof item === "object" && (item as Record<string, unknown>).label === label) ||
    null
  ) as Record<string, unknown> | null;
}

function extractDownloadRequests(data: unknown): ParsedDownloadRequest[] {
  if (!Array.isArray(data)) return [];

  return data
    .map((entry) => {
      const outputFormat = String(getLabelValueEntry(entry, "Output format")?.value || "").trim();
      const mediaQuality = String(getLabelValueEntry(entry, "Media quality")?.value || "").trim();
      const requestTimestamp = Number((entry as Record<string, unknown>)?.timestamp || 0);
      const startTimestamp = Number(getLabelValueEntry(entry, "Start date")?.timestamp_value);
      const endTimestamp = Number(getLabelValueEntry(entry, "End date")?.timestamp_value);

      return {
        requestTimestamp: Number.isFinite(requestTimestamp) ? requestTimestamp : 0,
        startTimestamp: Number.isFinite(startTimestamp) ? startTimestamp : null,
        endTimestamp: Number.isFinite(endTimestamp) ? endTimestamp : null,
        outputFormat,
        mediaQuality,
      };
    })
    .filter((item) => item.outputFormat);
}

function getLatestJsonDownloadRequest(requests: ParsedDownloadRequest[]) {
  return (
    requests
      .filter((item) => item.outputFormat.toLowerCase() === "json")
      .sort((a, b) => b.requestTimestamp - a.requestTimestamp)[0] || null
  );
}

function getReadinessNote(
  hasRelationshipFiles: boolean,
  rangeLabel: string,
  hasInsightMetrics: boolean,
) {
  if (hasRelationshipFiles) {
    const relationshipAccess = getNotFollowingBackAccess(rangeLabel);
    if (relationshipAccess.eligible) {
      return "this export meets the required launch settings and is ready for your overview and relationship workflow.";
    }

    if (hasInsightMetrics) {
      return "this export is missing the required launch settings for the current soft launch.";
    }

    return "this export is missing the required launch settings for the current soft launch.";
  }

  return "this export is missing the required launch settings for the current soft launch.";
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
      title: "not following back",
      status: hasRelationshipFiles
        ? input.relationshipEligible
          ? "ready"
          : "partial"
        : "later",
      note: hasRelationshipFiles
        ? input.relationshipEligible
          ? "followers and following records were detected and are ready to compare."
          : "followers and following records were detected and are ready to compare."
        : "needs both followers and following records.",
    },
    {
      id: "audience-insights",
      title: "audience insights",
      status: input.hasAudienceInsights ? "ready" : "later",
      note: input.hasAudienceInsights
        ? "audience insight summary files were detected."
        : "needs audience insight summary files.",
    },
    {
      id: "reach-summary",
      title: "reach summary",
      status: input.hasReachInsights ? "ready" : "later",
      note: input.hasReachInsights
        ? "reach summary files were detected."
        : "needs reach summary files.",
    },
    {
      id: "content-interactions",
      title: "content interactions",
      status: input.hasInteractionInsights ? "ready" : "later",
      note: input.hasInteractionInsights
        ? "interaction summary files were detected."
        : "needs content interaction files.",
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

  const direct = (stringMap as Record<string, unknown>)[key];
  if (direct && typeof direct === "object") {
    return String((direct as Record<string, unknown>).value || "").trim();
  }

  const normalizedTarget = key.trim().toLowerCase();
  for (const [candidateKey, candidateValue] of Object.entries(stringMap as Record<string, unknown>)) {
    if (candidateKey.trim().toLowerCase() !== normalizedTarget) continue;
    if (!candidateValue || typeof candidateValue !== "object") return "";
    return String((candidateValue as Record<string, unknown>).value || "").trim();
  }

  return "";
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

function parseInsightPercent(value: string) {
  const digits = String(value || "").replace(/[^\d.-]/g, "");
  if (!digits) return null;
  const number = Number(digits);
  return Number.isFinite(number) ? number : null;
}

function parseLeadingBreakdownValue(value: string) {
  const firstSegment = String(value || "")
    .split(",")
    .map((item) => item.trim())
    .find(Boolean);

  if (!firstSegment) {
    return {
      label: "",
      percent: null as number | null,
    };
  }

  const match = firstSegment.match(/^(.+?):\s*([\d.]+)%$/);
  if (!match) {
    return {
      label: firstSegment,
      percent: null as number | null,
    };
  }

  return {
    label: match[1].trim(),
    percent: parseInsightPercent(match[2]),
  };
}

function extractAudienceInsights(data: unknown): ParsedAudienceInsights | null {
  const entry = getFirstArrayItem(data, "organic_insights_audience");
  if (!entry) return null;

  const topCity = parseLeadingBreakdownValue(
    getStringMapValue(entry, "Follower Percentage by City"),
  );
  const topCountry = parseLeadingBreakdownValue(
    getStringMapValue(entry, "Follower Percentage by Country"),
  );
  const followerActivityDays = [
    { label: "Monday", value: parseInsightCount(getStringMapValue(entry, "Monday Follower Activity")) },
    { label: "Tuesday", value: parseInsightCount(getStringMapValue(entry, "Tuesday Follower Activity")) },
    { label: "Wednesday", value: parseInsightCount(getStringMapValue(entry, "Wednesday Follower Activity")) },
    { label: "Thursday", value: parseInsightCount(getStringMapValue(entry, "Thursday Follower Activity")) },
    { label: "Friday", value: parseInsightCount(getStringMapValue(entry, "Friday Follower Activity")) },
    { label: "Saturday", value: parseInsightCount(getStringMapValue(entry, "Saturday Follower Activity")) },
    { label: "Sunday", value: parseInsightCount(getStringMapValue(entry, "Sunday Follower Activity")) },
  ];
  const topActivityDay = followerActivityDays.reduce(
    (best, item) => {
      if (!Number.isFinite(item.value ?? NaN)) return best;
      if (!Number.isFinite(best.value ?? NaN) || (item.value ?? 0) > (best.value ?? 0)) {
        return item;
      }
      return best;
    },
    { label: "", value: null as number | null },
  );

  return {
    followerTotal: parseInsightCount(getStringMapValue(entry, "Followers")),
    followsInRange: parseInsightCount(getStringMapValue(entry, "Follows")),
    unfollowsInRange: parseInsightCount(getStringMapValue(entry, "Unfollows")),
    netFollowersInRange: parseInsightCount(getStringMapValue(entry, "Overall followers")),
    topFollowerCity: topCity.label,
    topFollowerCityPercent: topCity.percent,
    topFollowerCountry: topCountry.label,
    topFollowerCountryPercent: topCountry.percent,
    menFollowerPercent: parseInsightPercent(getStringMapValue(entry, "Total Follower Percentage for Men")),
    womenFollowerPercent: parseInsightPercent(getStringMapValue(entry, "Total Follower Percentage for Women")),
    followerActivityByDay: followerActivityDays.map((item) => ({
      label: item.label,
      shortLabel: item.label.slice(0, 3),
      value: item.value,
    })),
    topFollowerActivityDay: topActivityDay.label,
    topFollowerActivityValue: topActivityDay.value,
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
    reachFollowersPercent: parseInsightPercent(getStringMapValue(entry, "Followers")),
    reachNonFollowersPercent: parseInsightPercent(getStringMapValue(entry, "Non-Followers")),
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
    postLikes: parseInsightCount(getStringMapValue(entry, "Post Likes")),
    postComments: parseInsightCount(getStringMapValue(entry, "Post Comments")),
    postSaves: parseInsightCount(getStringMapValue(entry, "Post Saves")),
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

async function extractZipImportData(file: File): Promise<ExpandedImportData> {
  const fflate = await loadFflateScript();
  if (!fflate?.unzipSync || !fflate?.strFromU8) {
    throw new Error("ZIP support is unavailable right now.");
  }

  const archive = fflate.unzipSync(new Uint8Array(await file.arrayBuffer()));
  const jsonFiles: ImportFileLike[] = [];
  const archiveEntries = new Map<string, { bytes: Uint8Array; mimeType: string }>();

  for (const [path, bytes] of Object.entries(archive)) {
    const normalizedPath = normalizeArchivePath(path);

    if (/\.json$/i.test(path)) {
      jsonFiles.push({
        name: path.split("/").pop() || path,
        webkitRelativePath: `${file.name}/${path}`,
        text: async () => fflate.strFromU8(bytes),
      });
      continue;
    }

    const mimeType = getMimeTypeFromPath(path);
    if (mimeType) {
      archiveEntries.set(normalizedPath, { bytes, mimeType });
    }
  }

  return {
    jsonFiles,
    archiveEntries,
  };
}

async function expandImportedFiles(files: File[]): Promise<ExpandedImportData> {
  const jsonFiles: ImportFileLike[] = [];
  const archiveEntries = new Map<string, { bytes: Uint8Array; mimeType: string }>();

  for (const file of files) {
    if (file.name.toLowerCase().endsWith(".zip")) {
      const zipImportData = await extractZipImportData(file);
      jsonFiles.push(...zipImportData.jsonFiles);
      for (const [path, entry] of zipImportData.archiveEntries.entries()) {
        archiveEntries.set(path, entry);
      }
    } else {
      jsonFiles.push(file);
    }
  }

  return {
    jsonFiles: jsonFiles.filter((file) => /\.json$/i.test(file.name)),
    archiveEntries,
  };
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

  const expandedImportData = await expandImportedFiles(files);
  const expandedJsonFiles = expandedImportData.jsonFiles;
  if (!expandedJsonFiles.length) {
    throw new Error(
      `no json files were found. required settings: ${REQUIRED_EXPORT_SETTINGS_TEXT} upload the instagram ZIP or the extracted json export and try again.`,
    );
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
  let latestJsonDownloadRequest: ParsedDownloadRequest | null = null;

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
      if (profile?.profilePhotoPath) {
        const normalizedPhotoPath = normalizeArchivePath(profile.profilePhotoPath);
        const photoEntry = expandedImportData.archiveEntries.get(normalizedPhotoPath);
        if (photoEntry) {
          profile.profilePhotoDataUrl = createDataUrlFromBytes(photoEntry.bytes, photoEntry.mimeType);
        }
      }
      categorySet.add("profile");
      continue;
    }

    if (
      !latestJsonDownloadRequest &&
      /(^|\/)your_instagram_activity\/other_activity\/your_information_download_requests\.json$/i.test(
        normalizePathForMatch(file),
      )
    ) {
      latestJsonDownloadRequest = getLatestJsonDownloadRequest(extractDownloadRequests(parsed));
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

  const missingRequiredData = [
    profile ? null : requiredLaunchDataLabels[0],
    followerMatches.length ? null : requiredLaunchDataLabels[1],
    followingMatches.length ? null : requiredLaunchDataLabels[2],
    audienceInsights ? null : requiredLaunchDataLabels[3],
    reachInsights ? null : requiredLaunchDataLabels[4],
    interactionInsights ? null : requiredLaunchDataLabels[5],
  ].filter(Boolean) as string[];

  if (missingRequiredData.length) {
    throw new Error(
      getRequiredLaunchSettingsMessage(
        `missing required data: ${formatLabelList(missingRequiredData)}. `,
      ),
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
  const exportRequestRange = detectExportRequestRange(latestJsonDownloadRequest?.startTimestamp ?? null);
  const relationshipAccess = getNotFollowingBackAccess({
    rangeLabel: insightDateRangeLabel,
    exportRequestRange,
  });

  if (!relationshipAccess.eligible) {
    throw new Error(
      getRequiredLaunchSettingsMessage("the archive request history shows a limited export range. "),
    );
  }

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
    reachFollowersPercent: reachInsights?.reachFollowersPercent ?? null,
    reachNonFollowersPercent: reachInsights?.reachNonFollowersPercent ?? null,
    topFollowerCity: audienceInsights?.topFollowerCity || "",
    topFollowerCityPercent: audienceInsights?.topFollowerCityPercent ?? null,
    topFollowerCountry: audienceInsights?.topFollowerCountry || "",
    topFollowerCountryPercent: audienceInsights?.topFollowerCountryPercent ?? null,
    menFollowerPercent: audienceInsights?.menFollowerPercent ?? null,
    womenFollowerPercent: audienceInsights?.womenFollowerPercent ?? null,
    followerActivityByDay: audienceInsights?.followerActivityByDay || [],
    topFollowerActivityDay: audienceInsights?.topFollowerActivityDay || "",
    topFollowerActivityValue: audienceInsights?.topFollowerActivityValue ?? null,
    postLikes: interactionInsights?.postLikes ?? null,
    postComments: interactionInsights?.postComments ?? null,
    postSaves: interactionInsights?.postSaves ?? null,
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
      relationshipExportRange: exportRequestRange,
      exportRequestRange,
      exportRequestStartTimestamp: latestJsonDownloadRequest?.startTimestamp ?? null,
      exportRequestEndTimestamp: latestJsonDownloadRequest?.endTimestamp ?? null,
      exportRequestFormat: latestJsonDownloadRequest?.outputFormat || "",
      exportRequestMediaQuality: latestJsonDownloadRequest?.mediaQuality || "",
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
