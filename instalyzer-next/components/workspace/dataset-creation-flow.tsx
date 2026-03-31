"use client";

import { ArrowLeft, LoaderCircle } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  type ChangeEvent,
  type DragEvent,
  Fragment,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import {
  buildImportReview,
  makeDatasetId,
  saveLocalDataset,
  type DatasetEntryPoint,
} from "@/lib/instagram/local-datasets";

type CreationStep = "upload" | "create";

const uploadSupportSections = [
  {
    title: "before you start",
    items: [
      "You may need to log into Instagram first.",
      "Instagram may take a few minutes to prepare your file.",
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
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [datasetName, setDatasetName] = useState("");
  const [datasetDate, setDatasetDate] = useState(new Date().toISOString().slice(0, 10));
  const [nameTouched, setNameTouched] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessingUpload, setIsProcessingUpload] = useState(false);
  const [isPending, startTransition] = useTransition();

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

  const review = useMemo(
    () => (selectedFiles.length ? buildImportReview(selectedFiles) : null),
    [selectedFiles],
  );

  const hasDatasetName = datasetName.trim().length > 0;

  const handleFiles = (nextFiles: File[]) => {
    if (!nextFiles.length) return;

    if (processingTimeoutRef.current) {
      clearTimeout(processingTimeoutRef.current);
    }

    setSelectedFiles(nextFiles);
    setNameTouched(false);
    setIsProcessingUpload(true);
    setStep("create");

    processingTimeoutRef.current = setTimeout(() => {
      setIsProcessingUpload(false);
      processingTimeoutRef.current = null;
    }, 1100);
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

    if (!review || !hasDatasetName) {
      return;
    }

    const datasetId = makeDatasetId();

    saveLocalDataset({
      id: datasetId,
      name: datasetName.trim(),
      notes: "",
      createdAt: datasetDate,
      createdAtMs: Date.parse(`${datasetDate}T00:00:00`),
      entryPoint,
      importReview: review,
    });

    startTransition(() => {
      router.push(`/app/datasets/${datasetId}`);
    });
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
                </div>

                <input
                  ref={filesInputRef}
                  type="file"
                  multiple
                  hidden
                  accept=".json,.zip,application/json,application/zip"
                  onChange={onFilesChange}
                />

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
                    if (event.key !== "Enter" && event.key !== " ") return;
                    event.preventDefault();
                    filesInputRef.current?.click();
                  }}
                  onClick={() => filesInputRef.current?.click()}
                >
                  <div className="dataset-dropzone__icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24">
                      <path d="M12 4v11" />
                      <path d="m7.5 10.5 4.5 4.5 4.5-4.5" />
                      <path d="M5 19h14" />
                    </svg>
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
                        filesInputRef.current?.click();
                      }}
                    >
                      upload export ZIP
                    </button>
                  </div>

                  <p className="dataset-dropzone__reassurance">
                    no instagram login required.
                  </p>
                </div>
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
                    <div className="dataset-setup-form">
                      <label className="dataset-field">
                        <span>dataset name</span>
                        <input
                          type="text"
                          maxLength={60}
                          value={datasetName}
                          onChange={(event) => setDatasetName(event.target.value)}
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
                    </div>
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
                  disabled={!hasDatasetName || isPending}
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
