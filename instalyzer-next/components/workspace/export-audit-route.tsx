"use client";

import { AlertTriangle, CheckCircle2, FileArchive, LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
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

export function ExportAuditRoute() {
  const fileInputRef = useRef<HTMLInputElement>(null);
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
          ? error.message
          : "The ZIP audit could not be completed. Try the all-time export ZIP again.";
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
        <h1 className="section-title export-audit-route__title">compare a saved dataset against a raw export ZIP</h1>
        <p className="section-copy export-audit-route__copy">
          pick a saved dataset, drop in the matching instagram ZIP, and we&apos;ll compare the live workspace values
          against an independent raw-archive audit.
        </p>
      </div>

      {!datasets.length ? (
        <article className="export-audit-card export-audit-card--empty">
          <h2>no saved datasets yet</h2>
          <p>create a dataset first, then come back here to compare it against the original ZIP.</p>
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

            <button
              type="button"
              className="export-audit-dropzone"
              onClick={() => fileInputRef.current?.click()}
              disabled={!selectedDataset || isAuditing}
            >
              <span className="export-audit-dropzone__icon" aria-hidden="true">
                {isAuditing ? <LoaderCircle size={28} /> : <FileArchive size={28} />}
              </span>
              <strong>{isAuditing ? "auditing ZIP..." : "choose export ZIP"}</strong>
              <span>
                {auditFileName
                  ? `${auditFileName} ${isAuditing ? "is being checked now." : "was the latest ZIP audited."}`
                  : "use the matching all-time export ZIP for the selected dataset."}
              </span>
            </button>

            {selectedDataset ? (
              <div className="export-audit-dataset-note">
                <span>current selection</span>
                <strong>{selectedDataset.name}</strong>
                <small>{selectedDataset.scope?.insightDateRangeLabel || "overview window not detected"}</small>
              </div>
            ) : null}

            {auditError ? (
              <div className="export-audit-status export-audit-status--error">
                <AlertTriangle size={16} aria-hidden="true" />
                <span>{auditError}</span>
              </div>
            ) : null}
          </article>

          <article className="export-audit-card export-audit-card--results">
            <div className="export-audit-card__head">
              <h2>comparison</h2>
              <p>overview metrics and relationship signals are checked side by side.</p>
            </div>

            {!comparisonRows.length ? (
              <div className="export-audit-placeholder">
                <p>Run an audit to see exact matches and mismatches.</p>
              </div>
            ) : (
              <>
                <div
                  className={`export-audit-status ${
                    mismatchCount === 0 ? "export-audit-status--success" : "export-audit-status--warning"
                  }`}
                >
                  {mismatchCount === 0 ? (
                    <CheckCircle2 size={16} aria-hidden="true" />
                  ) : (
                    <AlertTriangle size={16} aria-hidden="true" />
                  )}
                  <span>
                    {mismatchCount === 0
                      ? "saved dataset matches the audited ZIP for every checked value."
                      : `${mismatchCount} checked value${mismatchCount === 1 ? "" : "s"} did not match the audited ZIP.`}
                  </span>
                </div>

                <div className="export-audit-table" role="table" aria-label="Dataset accuracy comparison">
                  <div className="export-audit-table__head" role="row">
                    <span role="columnheader">metric</span>
                    <span role="columnheader">saved dataset</span>
                    <span role="columnheader">raw ZIP</span>
                    <span role="columnheader">status</span>
                  </div>

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

                {auditSnapshot ? (
                  <div className="export-audit-reference">
                    <p>
                      reference note: audience insights followers ={" "}
                      <strong>{formatValue(auditSnapshot.audienceFollowers)}</strong>
                    </p>
                    <p>
                      audit source: <strong>{auditFileName}</strong> ({auditSnapshot.exportFormat || "unknown format"},{" "}
                      {auditSnapshot.mediaQuality || "unknown quality"})
                    </p>
                  </div>
                ) : null}
              </>
            )}
          </article>
        </div>
      )}
    </section>
  );
}
