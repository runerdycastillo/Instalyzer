"use client";

import { AlertTriangle, CheckCircle2, FileArchive, LoaderCircle, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore, type DragEvent, type KeyboardEvent } from "react";
import {
  auditInstagramExportZip,
  compareDatasetAgainstAudit,
  type ExportAuditComparisonRow,
  type ExportAuditSnapshot,
} from "@/lib/instagram/export-audit";
import {
  findLocalDataset,
  getLocalDatasetsServerSnapshot,
  readActiveDatasetId,
  readLocalDatasets,
  subscribeToLocalDatasets,
  type LocalDatasetRecord,
} from "@/lib/instagram/local-datasets";

function formatValue(value: number | string | null) {
  if (typeof value === "number") {
    return value.toLocaleString();
  }

  if (typeof value === "string" && value.trim()) {
    return value;
  }

  return "not available";
}

function formatImportedDate(value: string) {
  const date = new Date(value.includes("T") ? value : `${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return "import date unavailable";
  }

  return `imported ${date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })}`;
}

function formatAuditErrorMessage(rawMessage: string) {
  const message = rawMessage.trim();
  const normalizedMessage = message.toLowerCase();

  if (normalizedMessage.includes("invalid zip")) {
    return "choose a valid instagram zip";
  }

  if (normalizedMessage.includes("missing zip entry")) {
    return "that zip is missing required instagram data";
  }

  if (
    normalizedMessage.includes("zip support") ||
    normalizedMessage.includes("zip audit support") ||
    normalizedMessage.includes("support could not be loaded") ||
    normalizedMessage.includes("support failed to initialize")
  ) {
    return "zip audit is unavailable right now";
  }

  return message || "audit failed, try the export zip again";
}

function getAuditReferenceSettings(auditSnapshot: ExportAuditSnapshot) {
  if (!auditSnapshot.hasDownloadRequestMetadata) {
    return null;
  }

  const exportFormat = auditSnapshot.exportFormat || "unknown format";
  const mediaQuality = auditSnapshot.mediaQuality || "media quality not recorded";
  return { exportFormat, mediaQuality };
}

export function ExportAuditRoute() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const auditDragDepthRef = useRef(0);
  const datasets = useSyncExternalStore(
    subscribeToLocalDatasets,
    readLocalDatasets,
    getLocalDatasetsServerSnapshot,
  );
  const [selectedDatasetId, setSelectedDatasetId] = useState("");
  const [auditFileName, setAuditFileName] = useState("");
  const [auditSnapshot, setAuditSnapshot] = useState<ExportAuditSnapshot | null>(null);
  const [comparisonRows, setComparisonRows] = useState<ExportAuditComparisonRow[]>([]);
  const [isAuditing, setIsAuditing] = useState(false);
  const [isAuditDropTargetActive, setIsAuditDropTargetActive] = useState(false);
  const [auditError, setAuditError] = useState("");

  useEffect(() => {
    if (!datasets.length) {
      setSelectedDatasetId("");
      return;
    }

    setSelectedDatasetId((current) => {
      if (current && datasets.some((dataset) => dataset.id === current)) {
        return current;
      }

      const activeDatasetId = readActiveDatasetId();
      if (activeDatasetId && datasets.some((dataset) => dataset.id === activeDatasetId)) {
        return activeDatasetId;
      }

      return datasets[0]?.id || "";
    });
  }, [datasets]);

  const selectedDataset =
    (selectedDatasetId ? datasets.find((dataset) => dataset.id === selectedDatasetId) : null) ||
    (selectedDatasetId ? findLocalDataset(selectedDatasetId) : null);
  const mismatchCount = comparisonRows.filter((row) => !row.matches).length;
  const canResetAudit = !isAuditing && Boolean(auditFileName || auditError || auditSnapshot || comparisonRows.length);
  const auditReferenceSettings = auditSnapshot ? getAuditReferenceSettings(auditSnapshot) : null;
  const auditDropzoneTitle = isAuditing
    ? "auditing ZIP..."
    : isAuditDropTargetActive
      ? "drop ZIP to audit"
      : "choose export ZIP";
  const auditDropzoneHint = (() => {
    if (isAuditDropTargetActive) {
      return "release to audit";
    }

    if (isAuditing) {
      return "checking ZIP";
    }

    if (auditError) {
      return "audit failed";
    }

    if (auditFileName) {
      return "audit complete";
    }

    return "matching export ZIP";
  })();

  function resetAudit() {
    setAuditFileName("");
    setAuditError("");
    setAuditSnapshot(null);
    setComparisonRows([]);
    auditDragDepthRef.current = 0;
    setIsAuditDropTargetActive(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function openAuditFilePicker() {
    if (!selectedDataset || isAuditing || !fileInputRef.current) {
      return;
    }

    fileInputRef.current.value = "";
    fileInputRef.current.click();
  }

  function handleAuditKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.currentTarget !== event.target) {
      return;
    }

    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    openAuditFilePicker();
  }

  function handleAuditDragEnter(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();

    if (!selectedDataset || isAuditing) {
      return;
    }

    auditDragDepthRef.current += 1;
    setIsAuditDropTargetActive(true);
  }

  function handleAuditDragOver(event: DragEvent<HTMLDivElement>) {
    if (!selectedDataset || isAuditing) {
      return;
    }

    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  }

  function handleAuditDragLeave(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();

    auditDragDepthRef.current = Math.max(0, auditDragDepthRef.current - 1);

    if (auditDragDepthRef.current === 0) {
      setIsAuditDropTargetActive(false);
    }
  }

  function handleAuditDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    auditDragDepthRef.current = 0;
    setIsAuditDropTargetActive(false);

    if (!selectedDataset || isAuditing) {
      return;
    }

    const file = event.dataTransfer.files?.[0];

    if (!file) {
      return;
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    runAudit(file, selectedDataset);
  }

  async function runAudit(file: File, dataset: LocalDatasetRecord) {
    setIsAuditing(true);
    setAuditError("");
    setAuditFileName(file.name);

    try {
      const nextSnapshot = await auditInstagramExportZip(file);
      setAuditSnapshot(nextSnapshot);
      setComparisonRows(compareDatasetAgainstAudit(dataset, nextSnapshot));
    } catch (error) {
      const message =
        error instanceof Error
          ? formatAuditErrorMessage(error.message)
          : "audit failed, try the export zip again";
      setAuditError(message);
      setAuditSnapshot(null);
      setComparisonRows([]);
    } finally {
      setIsAuditing(false);
    }
  }

  return (
    <section className="export-audit-route">
      <div className="export-audit-route__intro">
        <p className="section-kicker">accuracy audit</p>
        <h1 className="section-title export-audit-route__title">audit dataset</h1>
        <p className="section-copy export-audit-route__copy">
          compare a saved dataset with its original instagram export ZIP.
        </p>
      </div>

      {!datasets.length ? (
        <article className="export-audit-card export-audit-card--empty">
          <span className="export-audit-empty-card__icon" aria-hidden="true">
            <FileArchive size={24} />
          </span>
          <h2>no saved datasets yet</h2>
          <p>create a dataset to audit its export ZIP.</p>
          <Link href="/app/datasets/new?entry=workspace-shell" className="hero-btn hero-btn-primary">
            create dataset
          </Link>
        </article>
      ) : (
        <div className="export-audit-grid">
          <article className="export-audit-card">
            <div className="export-audit-card__head">
              <h2>run audit</h2>
              <p>select the saved dataset you want to verify.</p>
            </div>

            <label className="export-audit-field">
              <span>saved dataset</span>
              <select
                value={selectedDatasetId}
                onChange={(event) => setSelectedDatasetId(event.target.value)}
                disabled={isAuditing}
              >
                {datasets.map((dataset) => (
                  <option key={dataset.id} value={dataset.id}>
                    {dataset.name}
                  </option>
                ))}
              </select>
            </label>

            <input
              ref={fileInputRef}
              type="file"
              accept=".zip,application/zip"
              hidden
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file || !selectedDataset) return;
                runAudit(file, selectedDataset);
              }}
            />

            {selectedDataset ? (
              <div className="export-audit-dataset-note">
                <span>current selection</span>
                <strong>{selectedDataset.name}</strong>
                <small>{formatImportedDate(selectedDataset.createdAt)}</small>
              </div>
            ) : null}

            {auditError ? (
              <div className="export-audit-inline-error" role="alert">
                <AlertTriangle size={14} aria-hidden="true" />
                <span>{auditError}</span>
              </div>
            ) : null}

            <div
              role="button"
              tabIndex={selectedDataset && !isAuditing ? 0 : -1}
              className={`export-audit-dropzone${isAuditDropTargetActive ? " is-dragging" : ""}${
                isAuditing ? " is-loading" : ""
              }`}
              aria-label={isAuditing ? "auditing ZIP" : auditDropzoneTitle}
              aria-disabled={!selectedDataset || isAuditing}
              onClick={openAuditFilePicker}
              onKeyDown={handleAuditKeyDown}
              onDragEnter={handleAuditDragEnter}
              onDragOver={handleAuditDragOver}
              onDragLeave={handleAuditDragLeave}
              onDrop={handleAuditDrop}
            >
              {canResetAudit ? (
                <button
                  type="button"
                  className="export-audit-reset"
                  aria-label="reset audit"
                  title="reset audit"
                  onClick={(event) => {
                    event.stopPropagation();
                    resetAudit();
                  }}
                >
                  <RotateCcw size={14} aria-hidden="true" />
                </button>
              ) : null}

              <span className="export-audit-dropzone__icon" aria-hidden="true">
                {isAuditing ? <LoaderCircle size={28} /> : <FileArchive size={28} />}
              </span>
              {isAuditing ? null : (
                <>
                  <strong>{auditDropzoneTitle}</strong>
                  <span>{auditDropzoneHint}</span>
                </>
              )}
            </div>
          </article>

          <div className="export-audit-results-stack">
            <article className="export-audit-card export-audit-card--results">
              <div className="export-audit-card__head export-audit-card__head--comparison">
                <div className="export-audit-card__head-copy">
                  <h2>comparison</h2>
                </div>
                {comparisonRows.length ? (
                  <div
                    className={`export-audit-result-note ${
                      mismatchCount === 0 ? "export-audit-result-note--success" : "export-audit-result-note--warning"
                    }`}
                  >
                    {mismatchCount === 0 ? (
                      <CheckCircle2 size={16} aria-hidden="true" />
                    ) : (
                      <AlertTriangle size={16} aria-hidden="true" />
                    )}
                    <span>
                      {mismatchCount === 0
                        ? "dataset matches"
                        : `${mismatchCount} mismatch${mismatchCount === 1 ? "" : "es"}`}
                    </span>
                  </div>
                ) : null}
              </div>

              {!comparisonRows.length ? (
                <div className="export-audit-placeholder">
                  <p>metrics will appear here after the audit runs.</p>
                </div>
              ) : (
                <>
                  <div className="export-audit-table" role="table" aria-label="Dataset accuracy comparison">
                    <div className="export-audit-table__head" role="row">
                      <span role="columnheader">metric</span>
                      <span role="columnheader">saved dataset</span>
                      <span role="columnheader">raw ZIP</span>
                      <span role="columnheader">status</span>
                    </div>

                    <div className="export-audit-table__body" role="rowgroup">
                      {comparisonRows.map((row) => (
                        <div key={row.key} className="export-audit-table__row" role="row">
                          <span role="cell">{row.label}</span>
                          <strong role="cell">{formatValue(row.datasetValue)}</strong>
                          <strong role="cell">{formatValue(row.auditValue)}</strong>
                          <span role="cell" className={row.matches ? "is-match" : "is-mismatch"}>
                            {row.matches ? "match" : "mismatch"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </article>

            {auditSnapshot ? (
              <div className="export-audit-info-grid" aria-label="Audit reference details">
                <article className="export-audit-info-card">
                  <span>reference</span>
                  <strong>{formatValue(auditSnapshot.audienceFollowers)}</strong>
                  <small>audience followers</small>
                </article>
                <article className="export-audit-info-card">
                  <span>audit source</span>
                  <strong>{auditFileName || "export ZIP"}</strong>
                  {auditReferenceSettings ? (
                    <div className="export-audit-info-card__meta">
                      <small>
                        <b>file type:</b> {auditReferenceSettings.exportFormat}
                      </small>
                      <small>
                        <b>quality:</b> {auditReferenceSettings.mediaQuality}
                      </small>
                    </div>
                  ) : (
                    <small>request metadata not included in this export</small>
                  )}
                </article>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </section>
  );
}
