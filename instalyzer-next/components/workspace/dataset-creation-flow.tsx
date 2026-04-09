"use client";

import { AlertTriangle, ArrowLeft, Check, CheckCircle2, ExternalLink, FileArchive, LoaderCircle, X } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  type ChangeEvent,
  type DragEvent,
  Fragment,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  useTransition,
} from "react";
import {
  type DatasetEntryPoint,
  prepareDatasetDraft,
} from "@/lib/instagram/export-parser";
import {
  exportQuickTipSections,
  INSTAGRAM_APP_URL,
  REQUIRED_EXPORT_SETTINGS_TEXT,
} from "@/lib/instagram/export-requirements";
import {
  DATASET_NAME_MAX_LENGTH,
  getLocalDatasetsServerSnapshot,
  hasReachedLocalDatasetLimit,
  LOCAL_DATASET_LIMIT_MESSAGE,
  MAX_LOCAL_DATASETS,
  makeDatasetId,
  readLocalDatasets,
  saveLocalDataset,
  subscribeToLocalDatasets,
} from "@/lib/instagram/local-datasets";

type CreationStep = "upload" | "create";
const entryPointValues = new Set<DatasetEntryPoint>([
  "home-hero",
  "home-results-preview",
  "home-pricing-free",
  "home-pricing-basic",
  "home-pricing-premium",
  "home-final-cta",
  "help-cta",
  "workspace-shell",
  "datasets-index",
  "app-home",
  "unknown",
]);

function formatUploadErrorMessage(rawMessage: string) {
  const message = String(rawMessage || "").trim();

  if (!message) {
    return "we couldn't read that export. try the instagram zip or extracted json folder.";
  }

  if (message.includes("no json files were found")) {
    return "we couldn't find any instagram json files in that upload. upload the original instagram zip or the extracted json export and try again.";
  }

  if (message.includes("required launch settings")) {
    if (message.includes("limited export range")) {
      return `this export used a limited date range. required settings: ${REQUIRED_EXPORT_SETTINGS_TEXT} re-export from instagram and try again.`;
    }

    return `this export is missing the required instagram settings. required settings: ${REQUIRED_EXPORT_SETTINGS_TEXT} re-export from instagram and try again.`;
  }

  return message;
}

function isSettingsValidationError(message: string) {
  return message.includes("required instagram settings") || message.includes("limited date range");
}

function DatasetFlowQuickTips() {
  return (
    <aside className="dataset-flow__side dataset-flow__side--upload">
      <p className="guide-side-stack-label dataset-upload-tips-label">quick tips</p>

      <div className="guide-side-card guide-side-card-v2 guide-side-card-unified dataset-upload-tips-card">
        <div className="guide-side-card__topbar">
          <a
            href={INSTAGRAM_APP_URL}
            target="_blank"
            rel="noreferrer"
            className="guide-inline-instagram-btn"
            aria-label="Open Instagram"
            title="Open Instagram"
          >
            <ExternalLink aria-hidden="true" strokeWidth={1.9} />
          </a>
        </div>

        {exportQuickTipSections.map((section) => (
          <div key={section.title} className="guide-side-section">
            <div className="guide-side-section-head">
              <h4 className="guide-side-section-title">{section.title}</h4>
            </div>

            <ul className="guide-side-list">
              {section.items.map((item, index) => (
                <li key={item}>
                  {"labels" in section && section.labels?.[index] ? (
                    <>
                      <strong>{section.labels[index]}:</strong> {item}
                    </>
                  ) : (
                    item
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </aside>
  );
}

export function DatasetCreationFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const filesInputRef = useRef<HTMLInputElement>(null);
  const datasetNameInputRef = useRef<HTMLInputElement>(null);
  const processingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [step, setStep] = useState<CreationStep>("upload");
  const [preparedDataset, setPreparedDataset] = useState<Awaited<
    ReturnType<typeof prepareDatasetDraft>
  > | null>(null);
  const [datasetName, setDatasetName] = useState("");
  const [datasetDate, setDatasetDate] = useState(new Date().toISOString().slice(0, 10));
  const [nameTouched, setNameTouched] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessingUpload, setIsProcessingUpload] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [creationError, setCreationError] = useState("");
  const [isPending, startTransition] = useTransition();
  const savedDatasets = useSyncExternalStore(
    subscribeToLocalDatasets,
    readLocalDatasets,
    getLocalDatasetsServerSnapshot,
  );

  const entryPointParam = searchParams.get("entry") || "unknown";
  const entryPoint = entryPointValues.has(entryPointParam as DatasetEntryPoint)
    ? (entryPointParam as DatasetEntryPoint)
    : "unknown";

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, []);

  useEffect(() => {
    return () => {
      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current);
      }
    };
  }, []);

  const review = useMemo(() => preparedDataset?.importReview || null, [preparedDataset]);
  const hasPreparedDraft = Boolean(preparedDataset);
  const hasReachedDatasetLimit = hasReachedLocalDatasetLimit(savedDatasets);
  const uploadErrorIsSettingsIssue = isSettingsValidationError(uploadError);

  useEffect(() => {
    if (step !== "create" || !review || isProcessingUpload) return;

    const focusTimer = window.setTimeout(() => {
      datasetNameInputRef.current?.focus();
      datasetNameInputRef.current?.select();
    }, 40);

    return () => {
      window.clearTimeout(focusTimer);
    };
  }, [isProcessingUpload, review, step]);

  const hasDatasetName = datasetName.trim().length > 0;

  const uploadDifferentExport = () => {
    setUploadError("");
    setIsDragging(false);
    if (hasReachedDatasetLimit) return;
    filesInputRef.current?.click();
  };

  const resetInvalidExportState = () => {
    setUploadError("");
    setIsDragging(false);
    setStep("upload");

    if (filesInputRef.current) {
      filesInputRef.current.value = "";
    }
  };

  const handleFiles = async (nextFiles: File[]) => {
    if (!nextFiles.length) return;

    if (processingTimeoutRef.current) {
      clearTimeout(processingTimeoutRef.current);
      processingTimeoutRef.current = null;
    }

    const startTime = Date.now();
    setPreparedDataset(null);
    setNameTouched(false);
    setUploadError("");
    setCreationError("");
    setIsProcessingUpload(true);

    if (hasReachedDatasetLimit) {
      setUploadError(LOCAL_DATASET_LIMIT_MESSAGE);
      setStep("upload");
      setIsProcessingUpload(false);
      return;
    }

    try {
      const nextPreparedDataset = await prepareDatasetDraft(nextFiles);
      const minimumProcessingMs = 1100;
      const remainingDelay = Math.max(0, minimumProcessingMs - (Date.now() - startTime));

      if (remainingDelay > 0) {
        await new Promise((resolve) => {
          processingTimeoutRef.current = setTimeout(() => {
            processingTimeoutRef.current = null;
            resolve(undefined);
          }, remainingDelay);
        });
      }

      setPreparedDataset(nextPreparedDataset);
      setDatasetName("");
      setStep("create");
    } catch (error) {
      const message =
        error instanceof Error
          ? formatUploadErrorMessage(error.message)
          : "we couldn't read that export. try the instagram zip or extracted json folder.";
      setUploadError(message);
      setPreparedDataset(null);
      setStep("upload");
    } finally {
      setIsProcessingUpload(false);
    }
  };

  const onFilesChange = (event: ChangeEvent<HTMLInputElement>) => {
    handleFiles(Array.from(event.target.files || []));
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    handleFiles(Array.from(event.dataTransfer.files || []));
  };

  const createDataset = () => {
    setNameTouched(true);

    if (!review || !preparedDataset || !hasDatasetName) {
      return;
    }

    if (hasReachedLocalDatasetLimit(readLocalDatasets())) {
      setCreationError(LOCAL_DATASET_LIMIT_MESSAGE);
      return;
    }

    const datasetId = makeDatasetId();

    try {
      saveLocalDataset({
        id: datasetId,
        name: datasetName.trim().slice(0, DATASET_NAME_MAX_LENGTH),
        notes: "",
        createdAt: datasetDate,
        createdAtMs: Date.parse(`${datasetDate}T00:00:00`),
        entryPoint,
        importReview: review,
        profile: preparedDataset.profile,
        scope: preparedDataset.scope,
        metrics: preparedDataset.metrics,
        meta: preparedDataset.meta,
        records: preparedDataset.records,
      });
      setCreationError("");
    } catch (error) {
      const message = error instanceof Error ? error.message : LOCAL_DATASET_LIMIT_MESSAGE;
      setCreationError(message);
      return;
    }

    startTransition(() => {
      router.push(`/app/datasets/${datasetId}`);
    });
  };

  const resetPreparedDraft = () => {
    if (processingTimeoutRef.current) {
      clearTimeout(processingTimeoutRef.current);
      processingTimeoutRef.current = null;
    }

    setPreparedDataset(null);
    setDatasetName("");
    setNameTouched(false);
    setUploadError("");
    setCreationError("");
    setIsDragging(false);
    setIsProcessingUpload(false);
    setStep("upload");

    if (filesInputRef.current) {
      filesInputRef.current.value = "";
    }
  };

  return (
    <section className="dataset-flow" aria-labelledby="dataset-flow-title">
      <div className="dataset-flow__hero">
        <div className="section-intro dataset-flow__hero-copy">
          <p className="section-kicker">create dataset</p>
          <h1 id="dataset-flow-title" className="section-title dataset-flow__hero-title">
            turn your export into a reusable dataset
          </h1>
          <p className="section-copy dataset-flow__description">
            upload your instagram export and create a reusable dataset.
          </p>
        </div>
      </div>

        <div className="dataset-flow__steps" aria-label="Dataset creation steps">
          {[
            { key: "upload", label: "upload" },
            { key: "create", label: "create" },
          ].map((item, index, items) => (
          <Fragment key={item.key}>
            <button
              type="button"
              className={`dataset-flow__step${step === item.key ? " is-active" : ""}`}
              disabled={item.key === "create" ? !review : false}
              onClick={() => setStep(item.key as CreationStep)}
            >
              {item.label}
            </button>

            {index < items.length - 1 ? (
              <span className="dataset-flow__step-chevron" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path d="m9 6 6 6-6 6" />
                </svg>
              </span>
            ) : null}
          </Fragment>
        ))}
      </div>

      <div
        className={`dataset-flow__grid${
          step === "upload" ? " is-upload-step" : step === "create" ? " is-create-step" : ""
        }`}
      >
        {step === "upload" ? (
          <>
            <article className="dataset-flow__panel dataset-flow__panel--primary">
              <div className="dataset-flow__stage">
                <div className="dataset-flow__copy">
                  <p className="dataset-flow__kicker">step 1</p>
                  <h2>upload your export</h2>
                  <p>upload your instagram export to get started.</p>
                  {hasReachedDatasetLimit ? (
                    <p className="dataset-field__error">
                      {LOCAL_DATASET_LIMIT_MESSAGE} You already have {MAX_LOCAL_DATASETS} saved exports.
                    </p>
                  ) : null}
                </div>

                <input
                  ref={filesInputRef}
                  type="file"
                  multiple
                  hidden
                  accept=".json,.zip,application/json,application/zip"
                  onChange={onFilesChange}
                />

                {hasPreparedDraft ? (
                    <div className="dataset-processing-panel dataset-processing-panel--ready" aria-live="polite">
                      <div className="dataset-processing-panel__spinner" aria-hidden="true">
                        <CheckCircle2 size={28} strokeWidth={1.9} />
                      </div>
                      <div className="dataset-processing-panel__copy">
                        <p>current export loaded</p>
                        <span>finish creating this dataset or reset it before uploading another export.</span>
                      </div>
                      <div className="dataset-dropzone__actions dataset-dropzone__actions--stacked">
                        <button
                          type="button"
                          className="hero-btn hero-btn-secondary dataset-dropzone__secondary-action"
                          onClick={resetPreparedDraft}
                        >
                          reset
                        </button>
                        <button
                          type="button"
                          className="hero-btn hero-btn-primary dataset-dropzone__primary-action"
                          onClick={() => setStep("create")}
                        >
                          create
                        </button>
                      </div>
                    </div>
                ) : isProcessingUpload ? (
                  <div className="dataset-processing-panel dataset-processing-panel--upload" aria-live="polite">
                    <div className="dataset-processing-panel__spinner" aria-hidden="true">
                      <LoaderCircle size={28} />
                    </div>
                    <div className="dataset-processing-panel__copy">
                      <p>checking your export</p>
                      <span>verifying your settings and preparing your dataset.</span>
                    </div>
                  </div>
                ) : uploadErrorIsSettingsIssue ? (
                  <div className="dataset-invalid-export-state" role="alert" aria-live="polite">
                    <div className="dataset-invalid-export-state__icon" aria-hidden="true">
                      <AlertTriangle size={20} strokeWidth={1.9} />
                    </div>
                    <div className="dataset-invalid-export-state__copy">
                      <strong>wrong export settings</strong>
                      <p>your export does not include the required data needed for analysis.</p>
                    </div>
                    <div className="dataset-invalid-export-state__requirements">
                      <span>required settings</span>
                      <ul>
                        <li>
                          <i aria-hidden="true">
                            <Check size={12} strokeWidth={2.1} />
                          </i>
                          <span>customize information → all available information</span>
                        </li>
                        <li>
                          <i aria-hidden="true">
                            <Check size={12} strokeWidth={2.1} />
                          </i>
                          <span>date range → all time</span>
                        </li>
                        <li>
                          <i aria-hidden="true">
                            <Check size={12} strokeWidth={2.1} />
                          </i>
                          <span>format → JSON</span>
                        </li>
                      </ul>
                    </div>
                    <div className="dataset-invalid-export-state__actions">
                      <button
                        type="button"
                        className="hero-btn hero-btn-primary dataset-invalid-export-state__primary-action"
                        onClick={resetInvalidExportState}
                      >
                        try again
                      </button>
                    </div>
                    <Link href="/help" className="dataset-invalid-export-state__guide-link">
                      view export setup guide
                    </Link>
                  </div>
                ) : (
                  <div
                    className={`dataset-dropzone${isDragging ? " is-dragging" : ""}`}
                    role="button"
                    tabIndex={0}
                    onDragEnter={(event) => {
                      event.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragOver={(event) => {
                      event.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={(event) => {
                      event.preventDefault();
                      setIsDragging(false);
                    }}
                    onDrop={onDrop}
                    onKeyDown={(event) => {
                      if (hasReachedDatasetLimit) return;
                      if (event.key !== "Enter" && event.key !== " ") return;
                      event.preventDefault();
                      filesInputRef.current?.click();
                    }}
                    onClick={() => {
                      if (hasReachedDatasetLimit) return;
                      filesInputRef.current?.click();
                    }}
                  >
                    <div className="dataset-dropzone__icon" aria-hidden="true">
                      <FileArchive size={28} strokeWidth={1.9} />
                    </div>
                    <p>
                      drag and drop your ZIP or choose your export to begin.
                    </p>

                    <div className="dataset-dropzone__actions">
                    <button
                        type="button"
                        className="hero-btn hero-btn-primary dataset-dropzone__primary-action"
                        onClick={(event) => {
                          event.stopPropagation();
                          uploadDifferentExport();
                        }}
                        disabled={hasReachedDatasetLimit}
                      >
                        upload export ZIP
                      </button>
                    </div>

                    <p className="dataset-dropzone__reassurance">
                      no instagram login required.
                    </p>
                  </div>
                )}

                {!hasPreparedDraft && uploadError && !uploadErrorIsSettingsIssue ? (
                  <div
                    className={`dataset-upload-alert${
                      uploadErrorIsSettingsIssue ? " dataset-upload-alert--settings" : ""
                    }`}
                    role="alert"
                    aria-live="polite"
                  >
                    <div className="dataset-upload-alert__head">
                      <div className="dataset-upload-alert__heading-group">
                        <span className="dataset-upload-alert__icon" aria-hidden="true">
                          <AlertTriangle size={16} strokeWidth={1.9} />
                        </span>
                        <div className="dataset-upload-alert__copy">
                          <strong>
                            {uploadErrorIsSettingsIssue ? "wrong export settings" : "upload issue"}
                          </strong>
                          <p>
                            {uploadErrorIsSettingsIssue
                              ? "your export does not include the required data needed for analysis."
                              : uploadError}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="dataset-upload-alert__dismiss"
                        onClick={() => setUploadError("")}
                        aria-label="Dismiss upload error"
                      >
                        <X size={14} strokeWidth={1.9} />
                      </button>
                    </div>

                    {uploadErrorIsSettingsIssue ? (
                      <>
                        <div className="dataset-upload-alert__requirements">
                          <span>required settings</span>
                          <ul>
                            <li>customize information → all available information</li>
                            <li>date range → all time</li>
                            <li>format → JSON</li>
                          </ul>
                        </div>
                        <Link href="/help" className="hero-btn hero-btn-secondary dataset-upload-alert__action">
                          view export setup guide
                        </Link>
                      </>
                    ) : (
                      <Link href="/help" className="dataset-dropzone__help-link">
                        view export setup guide
                      </Link>
                    )}
                  </div>
                ) : null}
              </div>
            </article>

            <DatasetFlowQuickTips />
          </>
        ) : (
          <div className="dataset-flow__create-shell">
            <article className="dataset-flow__panel">
              {step === "create" && review ? (
                <div className="dataset-flow__stage">
                  <div className="dataset-flow__copy">
                    <p className="dataset-flow__kicker">step 2</p>
                    <h2>create your dataset</h2>
                    <p>your export is ready. give this dataset a name to continue.</p>
                  </div>

                  <form
                    className="dataset-setup-form"
                    onSubmit={(event) => {
                      event.preventDefault();
                      createDataset();
                    }}
                  >
                    <label className="dataset-field">
                      <span>dataset name</span>
                      <input
                        ref={datasetNameInputRef}
                        type="text"
                        maxLength={DATASET_NAME_MAX_LENGTH}
                        value={datasetName}
                        onChange={(event) =>
                          setDatasetName(event.target.value.slice(0, DATASET_NAME_MAX_LENGTH))
                        }
                        onBlur={() => setNameTouched(true)}
                        placeholder="march instagram export"
                      />
                      {nameTouched && !hasDatasetName ? (
                        <small className="dataset-field__error">
                          enter a dataset name to continue
                        </small>
                      ) : null}
                    </label>

                    <label className="dataset-field">
                      <span>dataset date</span>
                      <input
                        type="date"
                        value={datasetDate}
                        onChange={(event) => setDatasetDate(event.target.value)}
                      />
                    </label>
                    {creationError ? <small className="dataset-field__error">{creationError}</small> : null}
                  </form>
                </div>
              ) : null}
            </article>

            {step === "create" && review && !isProcessingUpload ? (
              <div className="dataset-flow__footer dataset-flow__footer--outside">
                <button
                  type="button"
                  className="hero-btn hero-btn-secondary dataset-flow__back-icon"
                  onClick={() => {
                    if (processingTimeoutRef.current) {
                      clearTimeout(processingTimeoutRef.current);
                      processingTimeoutRef.current = null;
                    }
                    setIsProcessingUpload(false);
                    setStep("upload");
                  }}
                  aria-label="go back to upload"
                >
                  <ArrowLeft size={16} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="hero-btn hero-btn-primary"
                  onClick={createDataset}
                  disabled={!hasDatasetName || isPending || hasReachedDatasetLimit}
                >
                  {isPending ? "creating..." : "create dataset"}
                </button>
              </div>
            ) : null}
          </div>
        )}

      </div>
    </section>
  );
}
