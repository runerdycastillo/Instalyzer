import type {
  DatasetEntryPoint,
  DatasetImportReview,
  DatasetMeta,
  DatasetMetrics,
  DatasetProfile,
  DatasetRelationshipRecord,
  DatasetScope,
} from "@/lib/instagram/export-parser";

export const LOCAL_DATASETS_STORAGE_KEY = "instalyzer_next_guest_datasets_v1";
const LOCAL_DATASETS_EVENT = "instalyzer:datasets-changed";
export const ACTIVE_DATASET_STORAGE_KEY = "instalyzer_next_active_dataset_v1";
const ACTIVE_DATASET_EVENT = "instalyzer:active-dataset-changed";
export const RECENT_DATASET_HISTORY_STORAGE_KEY = "instalyzer_next_recent_dataset_history_v1";
export const EMPTY_LOCAL_DATASETS: LocalDatasetRecord[] = [];
export const DATASET_NAME_MAX_LENGTH = 16;
export const MAX_LOCAL_DATASETS = 6;
export const LOCAL_DATASET_LIMIT_MESSAGE = `You can save up to ${MAX_LOCAL_DATASETS} exports. Delete one to import a new export.`;

let cachedDatasetsRaw: string | null = null;
let cachedDatasetsParsed: LocalDatasetRecord[] = EMPTY_LOCAL_DATASETS;

export type LocalDatasetRecord = {
  id: string;
  name: string;
  notes: string;
  createdAt: string;
  createdAtMs: number;
  entryPoint: DatasetEntryPoint;
  importReview: DatasetImportReview;
  profile?: DatasetProfile | null;
  scope?: DatasetScope;
  metrics?: DatasetMetrics;
  meta?: DatasetMeta;
  records?: {
    followers: DatasetRelationshipRecord[];
    following: DatasetRelationshipRecord[];
  };
};

const entryPointLabels: Record<DatasetEntryPoint, string> = {
  "home-hero": "Homepage hero",
  "home-results-preview": "Results preview",
  "home-pricing-free": "Pricing free",
  "home-pricing-basic": "Pricing basic",
  "home-pricing-premium": "Pricing premium",
  "home-final-cta": "Final CTA",
  "help-cta": "Help page",
  "workspace-shell": "Workspace shell",
  "datasets-index": "Datasets index",
  "app-home": "App home",
  unknown: "Direct route",
};

export function makeDatasetId() {
  return `dataset_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function getEntryPointLabel(entryPoint: DatasetEntryPoint) {
  return entryPointLabels[entryPoint] || entryPointLabels.unknown;
}

export function getNextDefaultDatasetName(datasets: LocalDatasetRecord[] = readLocalDatasets()) {
  const highestExportNumber = datasets.reduce((highest, dataset) => {
    const match = dataset.name.trim().match(/^export\s+(\d+)$/i);
    if (!match) return highest;

    const parsedNumber = Number(match[1]);
    return Number.isFinite(parsedNumber) ? Math.max(highest, parsedNumber) : highest;
  }, 0);

  return `export ${highestExportNumber + 1}`;
}

export function hasReachedLocalDatasetLimit(
  datasets: LocalDatasetRecord[] = readLocalDatasets(),
  nextDatasetId?: string,
) {
  if (nextDatasetId && datasets.some((dataset) => dataset.id === nextDatasetId)) {
    return false;
  }

  return datasets.length >= MAX_LOCAL_DATASETS;
}

export function readLocalDatasets(): LocalDatasetRecord[] {
  if (typeof window === "undefined") return EMPTY_LOCAL_DATASETS;

  try {
    const raw = window.localStorage.getItem(LOCAL_DATASETS_STORAGE_KEY);

    if (raw === cachedDatasetsRaw) {
      return cachedDatasetsParsed;
    }

    const parsed = raw ? (JSON.parse(raw) as unknown) : EMPTY_LOCAL_DATASETS;
    cachedDatasetsRaw = raw;
    cachedDatasetsParsed = Array.isArray(parsed)
      ? (parsed as LocalDatasetRecord[])
      : EMPTY_LOCAL_DATASETS;
    return cachedDatasetsParsed;
  } catch {
    cachedDatasetsRaw = null;
    cachedDatasetsParsed = EMPTY_LOCAL_DATASETS;
    return EMPTY_LOCAL_DATASETS;
  }
}

export function getLocalDatasetsServerSnapshot() {
  return EMPTY_LOCAL_DATASETS;
}

export function readActiveDatasetId() {
  if (typeof window === "undefined") return null;

  try {
    return window.localStorage.getItem(ACTIVE_DATASET_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function readRecentDatasetHistory() {
  if (typeof window === "undefined") return [] as string[];

  try {
    const raw = window.localStorage.getItem(RECENT_DATASET_HISTORY_STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed)
      ? parsed
          .map((value) => String(value || "").trim())
          .filter(Boolean)
          .filter((value, index, array) => array.indexOf(value) === index)
          .slice(0, 2)
      : [];
  } catch {
    return [];
  }
}

export function getActiveDatasetServerSnapshot() {
  return null;
}

export function writeActiveDatasetId(datasetId: string | null) {
  if (typeof window === "undefined") return;

  if (datasetId) {
    window.localStorage.setItem(ACTIVE_DATASET_STORAGE_KEY, datasetId);
    const nextHistory = [datasetId, ...readRecentDatasetHistory().filter((item) => item !== datasetId)].slice(0, 2);
    window.localStorage.setItem(RECENT_DATASET_HISTORY_STORAGE_KEY, JSON.stringify(nextHistory));
  } else {
    window.localStorage.removeItem(ACTIVE_DATASET_STORAGE_KEY);
  }

  window.dispatchEvent(new Event(ACTIVE_DATASET_EVENT));
}

export function writeLocalDatasets(datasets: LocalDatasetRecord[]) {
  if (typeof window === "undefined") return;
  const raw = JSON.stringify(datasets);
  cachedDatasetsRaw = raw;
  cachedDatasetsParsed = datasets;
  window.localStorage.setItem(LOCAL_DATASETS_STORAGE_KEY, raw);
  window.dispatchEvent(new Event(LOCAL_DATASETS_EVENT));
}

export function saveLocalDataset(dataset: LocalDatasetRecord) {
  const current = readLocalDatasets();
  if (hasReachedLocalDatasetLimit(current, dataset.id)) {
    throw new Error(LOCAL_DATASET_LIMIT_MESSAGE);
  }
  const normalizedDataset = {
    ...dataset,
    name: dataset.name.trim().slice(0, DATASET_NAME_MAX_LENGTH),
  };
  writeLocalDatasets([normalizedDataset, ...current.filter((item) => item.id !== dataset.id)]);
}

export function updateLocalDatasetName(datasetId: string, nextName: string) {
  const normalizedName = nextName.trim().slice(0, DATASET_NAME_MAX_LENGTH);
  if (!normalizedName) return readLocalDatasets();

  const current = readLocalDatasets();
  const next = current.map((item) =>
    item.id === datasetId
      ? {
          ...item,
          name: normalizedName,
        }
      : item,
  );

  writeLocalDatasets(next);
  return next;
}

export function deleteLocalDataset(datasetId: string) {
  const current = readLocalDatasets();
  const next = current.filter((item) => item.id !== datasetId);
  const activeDatasetId = readActiveDatasetId();
  writeLocalDatasets(next);

  if (activeDatasetId === datasetId) {
    writeActiveDatasetId(next[0]?.id || null);
  }

  return next;
}

export function findLocalDataset(datasetId: string) {
  return readLocalDatasets().find((dataset) => dataset.id === datasetId) || null;
}

export function subscribeToLocalDatasets(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handleStorage = (event: StorageEvent) => {
    if (event.key && event.key !== LOCAL_DATASETS_STORAGE_KEY) return;
    onStoreChange();
  };
  const handleLocalChange = () => onStoreChange();

  window.addEventListener("storage", handleStorage);
  window.addEventListener(LOCAL_DATASETS_EVENT, handleLocalChange);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(LOCAL_DATASETS_EVENT, handleLocalChange);
  };
}

export function subscribeToActiveDataset(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handleStorage = (event: StorageEvent) => {
    if (event.key && event.key !== ACTIVE_DATASET_STORAGE_KEY) return;
    onStoreChange();
  };
  const handleLocalChange = () => onStoreChange();

  window.addEventListener("storage", handleStorage);
  window.addEventListener(ACTIVE_DATASET_EVENT, handleLocalChange);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(ACTIVE_DATASET_EVENT, handleLocalChange);
  };
}
