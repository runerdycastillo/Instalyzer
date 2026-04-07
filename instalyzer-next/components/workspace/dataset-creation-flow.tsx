"use client";

import { ArrowLeft, CheckCircle2, FileArchive, LoaderCircle } from "lucide-react";
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

const uploadSupportSections = [
  {
    title: "before you start",
    items: [
      "We recommend staying logged into Instagram in your browser so result links open smoothly.",
      "Export prep can take minutes or hours, depending on account size.",
    ],
    instagramLink: true,
  },
  {
    title: "recommended settings",
    items: ["all available information", "all time", "JSON", "medium"],
    labels: ["customize information", "date range", "format", "media quality"],
  },
  {
    title: "common issues",
    items: [
      "No file? Check email and spam.",
      "Wrong format? Use JSON.",
      "Upload issue? Use the export ZIP file.",
    ],
  },
] as const;

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

function DatasetFlowQuickTips() {
  return (
    <aside className="dataset-flow__side dataset-flow__side--upload">
      <p className="guide-side-stack-label dataset-upload-tips-label">quick tips</p>

      <div className="guide-side-card guide-side-card-v2 guide-side-card-unified dataset-upload-tips-card">
        {uploadSupportSections.map((section) => (
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

  const hasDatasetName = datasetName.trim().length > 0;

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
    setStep("create");

    if (hasReachedDatasetLimit) {
      setUploadError(LOCAL_DATASET_LIMIT_MESSAGE);
      setStep("upload");
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
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "We couldn't read that export. Try the Instagram ZIP or extracted JSON folder.";
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

                    {uploadError ? <p className="dataset-field__error">{uploadError}</p> : null}

                    <div className="dataset-dropzone__actions">
                    <button
                        type="button"
                        className="hero-btn hero-btn-primary dataset-dropzone__primary-action"
                        onClick={(event) => {
                          event.stopPropagation();
                          if (hasReachedDatasetLimit) return;
                          filesInputRef.current?.click();
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
              </div>
            </article>

            <DatasetFlowQuickTips />
          </>
        ) : (
          <div className="dataset-flow__create-shell">
            <article className="dataset-flow__panel">
              {step === "create" && (isProcessingUpload || review) ? (
                <div className="dataset-flow__stage">
                  <div className="dataset-flow__copy">
                    <p className="dataset-flow__kicker">step 2</p>
                    <h2>{isProcessingUpload ? "processing your export" : "create your dataset"}</h2>
                    <p>
                      {isProcessingUpload
                        ? "checking your file and preparing your dataset."
                        : "your export is ready. give this dataset a name to continue."}
                    </p>
                  </div>

                  {isProcessingUpload ? (
                    <div className="dataset-processing-panel" aria-live="polite">
                      <div className="dataset-processing-panel__spinner" aria-hidden="true">
                        <LoaderCircle size={28} />
                      </div>
                      <div className="dataset-processing-panel__copy">
                        <p>preparing your dataset</p>
                        <span>this will just take a moment.</span>
                      </div>
                    </div>
                  ) : (
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
                  )}
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
