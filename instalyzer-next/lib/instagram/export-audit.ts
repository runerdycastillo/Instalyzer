"use client";

import type { LocalDatasetRecord } from "@/lib/instagram/local-datasets";

type ZipEntryMap = Record<string, Uint8Array>;

type FflateApi = {
  unzipSync(data: Uint8Array): ZipEntryMap;
  strFromU8(data: Uint8Array): string;
};

declare global {
  interface Window {
    fflate?: FflateApi;
  }
}

export type ExportAuditSnapshot = {
  overviewWindow: string;
  accountsReached: number | null;
  profileVisits: number | null;
  externalLinkTaps: number | null;
  contentInteractions: number | null;
  accountsEngaged: number | null;
  impressions: number | null;
  followers: number;
  following: number;
  mutuals: number;
  notFollowingBack: number;
  audienceFollowers: number | null;
  exportStartTimestamp: number | null;
  exportEndTimestamp: number | null;
  exportFormat: string;
  mediaQuality: string;
};

export type ExportAuditComparisonRow = {
  key:
    | "overviewWindow"
    | "accountsReached"
    | "profileVisits"
    | "externalLinkTaps"
    | "contentInteractions"
    | "accountsEngaged"
    | "impressions"
    | "followers"
    | "following"
    | "mutuals"
    | "notFollowingBack";
  label: string;
  datasetValue: number | string | null;
  auditValue: number | string | null;
  matches: boolean;
};

let fflateLoaderPromise: Promise<FflateApi> | null = null;

function normalizeArchivePath(path: string) {
  return String(path || "").replaceAll("\\", "/").replace(/^\/+/, "").toLowerCase();
}

function parseInsightCount(value: string) {
  const digits = String(value || "").replace(/[^\d-]/g, "");
  if (!digits) return null;
  const number = Number(digits);
  return Number.isFinite(number) ? number : null;
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

function normalizeUsername(value: string) {
  return value.trim().trimStart("@").toLowerCase();
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

  const first =
    ((record.string_list_data as Array<Record<string, unknown>> | undefined)?.[0] as Record<string, unknown> | undefined) ||
    null;

  if (!first) return "";

  const value = normalizeUsername(String(first.value || ""));
  if (value) return value;
  return extractUsernameFromHref(String(first.href || ""));
}

function createUniqueUsernames(entries: unknown[]) {
  const seen = new Set<string>();
  const usernames: string[] = [];

  for (const entry of entries) {
    const username = extractRelationshipUsername(entry);
    if (!username || seen.has(username)) continue;
    seen.add(username);
    usernames.push(username);
  }

  return usernames;
}

async function loadFflateScript() {
  if (typeof window === "undefined") {
    throw new Error("ZIP audit is only available in the browser.");
  }

  if (window.fflate?.unzipSync && window.fflate?.strFromU8) {
    return window.fflate;
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
      reject(new Error("ZIP audit support failed to initialize."));
    };

    const handleError = () => {
      fflateLoaderPromise = null;
      reject(new Error("ZIP audit support could not be loaded."));
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

function readZipJson(archive: ZipEntryMap, path: string, fflate: FflateApi) {
  const bytes = archive[normalizeArchivePath(path)];
  if (!bytes) {
    throw new Error(`Missing ZIP entry: ${path}`);
  }

  return JSON.parse(fflate.strFromU8(bytes)) as unknown;
}

export async function auditInstagramExportZip(file: File): Promise<ExportAuditSnapshot> {
  const fflate = await loadFflateScript();
  const archive = fflate.unzipSync(new Uint8Array(await file.arrayBuffer()));

  const reachData = readZipJson(
    archive,
    "logged_information/past_instagram_insights/profiles_reached.json",
    fflate,
  );
  const interactionData = readZipJson(
    archive,
    "logged_information/past_instagram_insights/content_interactions.json",
    fflate,
  );
  const audienceData = readZipJson(
    archive,
    "logged_information/past_instagram_insights/audience_insights.json",
    fflate,
  );
  const followersData = readZipJson(
    archive,
    "connections/followers_and_following/followers_1.json",
    fflate,
  );
  const followingData = readZipJson(
    archive,
    "connections/followers_and_following/following.json",
    fflate,
  );
  const downloadRequests = readZipJson(
    archive,
    "your_instagram_activity/other_activity/your_information_download_requests.json",
    fflate,
  );

  const reachEntry = extractEntries(reachData, "organic_insights_reach")[0];
  const interactionEntry = extractEntries(interactionData, "organic_insights_interactions")[0];
  const audienceEntry = extractEntries(audienceData, "organic_insights_audience")[0];

  const followers = createUniqueUsernames(extractEntries(followersData, "relationships_followers"));
  const following = createUniqueUsernames(extractEntries(followingData, "relationships_following"));
  const followerSet = new Set(followers);

  let mutuals = 0;
  let notFollowingBack = 0;

  for (const username of following) {
    if (followerSet.has(username)) {
      mutuals += 1;
    } else {
      notFollowingBack += 1;
    }
  }

  const latestJsonRequest =
    (Array.isArray(downloadRequests)
      ? [...downloadRequests]
          .filter((entry) => String(getLabelValueEntry(entry, "Output format")?.value || "") === "JSON")
          .sort(
            (a, b) =>
              Number((b as Record<string, unknown>).timestamp || 0) - Number((a as Record<string, unknown>).timestamp || 0),
          )[0]
      : null) || null;

  return {
    overviewWindow: getStringMapValue(reachEntry, "Date Range"),
    accountsReached: parseInsightCount(getStringMapValue(reachEntry, "Accounts reached")),
    profileVisits: parseInsightCount(getStringMapValue(reachEntry, "Profile visits")),
    externalLinkTaps: parseInsightCount(getStringMapValue(reachEntry, "External link taps")),
    contentInteractions: parseInsightCount(getStringMapValue(interactionEntry, "Content interactions")),
    accountsEngaged: parseInsightCount(getStringMapValue(interactionEntry, "Accounts engaged")),
    impressions: parseInsightCount(getStringMapValue(reachEntry, "Impressions")),
    followers: followers.length,
    following: following.length,
    mutuals,
    notFollowingBack,
    audienceFollowers: parseInsightCount(getStringMapValue(audienceEntry, "Followers")),
    exportStartTimestamp: Number(getLabelValueEntry(latestJsonRequest, "Start date")?.timestamp_value || 0) || null,
    exportEndTimestamp: Number(getLabelValueEntry(latestJsonRequest, "End date")?.timestamp_value || 0) || null,
    exportFormat: String(getLabelValueEntry(latestJsonRequest, "Output format")?.value || ""),
    mediaQuality: String(getLabelValueEntry(latestJsonRequest, "Media quality")?.value || ""),
  };
}

export function compareDatasetAgainstAudit(
  dataset: LocalDatasetRecord,
  audit: ExportAuditSnapshot,
): ExportAuditComparisonRow[] {
  return [
    {
      key: "overviewWindow",
      label: "overview window",
      datasetValue: dataset.scope?.insightDateRangeLabel || null,
      auditValue: audit.overviewWindow || null,
      matches: (dataset.scope?.insightDateRangeLabel || "") === audit.overviewWindow,
    },
    {
      key: "accountsReached",
      label: "accounts reached",
      datasetValue: dataset.metrics?.accountsReached ?? null,
      auditValue: audit.accountsReached,
      matches: (dataset.metrics?.accountsReached ?? null) === audit.accountsReached,
    },
    {
      key: "profileVisits",
      label: "profile visits",
      datasetValue: dataset.metrics?.profileVisits ?? null,
      auditValue: audit.profileVisits,
      matches: (dataset.metrics?.profileVisits ?? null) === audit.profileVisits,
    },
    {
      key: "externalLinkTaps",
      label: "external link taps",
      datasetValue: dataset.metrics?.externalLinkTaps ?? null,
      auditValue: audit.externalLinkTaps,
      matches: (dataset.metrics?.externalLinkTaps ?? null) === audit.externalLinkTaps,
    },
    {
      key: "contentInteractions",
      label: "content interactions",
      datasetValue: dataset.metrics?.contentInteractions ?? null,
      auditValue: audit.contentInteractions,
      matches: (dataset.metrics?.contentInteractions ?? null) === audit.contentInteractions,
    },
    {
      key: "accountsEngaged",
      label: "accounts engaged",
      datasetValue: dataset.metrics?.accountsEngaged ?? null,
      auditValue: audit.accountsEngaged,
      matches: (dataset.metrics?.accountsEngaged ?? null) === audit.accountsEngaged,
    },
    {
      key: "impressions",
      label: "impressions",
      datasetValue: dataset.metrics?.impressions ?? null,
      auditValue: audit.impressions,
      matches: (dataset.metrics?.impressions ?? null) === audit.impressions,
    },
    {
      key: "followers",
      label: "followers",
      datasetValue: dataset.metrics?.followerCount ?? null,
      auditValue: audit.followers,
      matches: (dataset.metrics?.followerCount ?? null) === audit.followers,
    },
    {
      key: "following",
      label: "following",
      datasetValue: dataset.metrics?.followingCount ?? null,
      auditValue: audit.following,
      matches: (dataset.metrics?.followingCount ?? null) === audit.following,
    },
    {
      key: "mutuals",
      label: "mutuals",
      datasetValue: dataset.metrics?.mutualCount ?? null,
      auditValue: audit.mutuals,
      matches: (dataset.metrics?.mutualCount ?? null) === audit.mutuals,
    },
    {
      key: "notFollowingBack",
      label: "not following back",
      datasetValue: dataset.metrics?.notFollowingBackCount ?? null,
      auditValue: audit.notFollowingBack,
      matches: (dataset.metrics?.notFollowingBackCount ?? null) === audit.notFollowingBack,
    },
  ];
}
