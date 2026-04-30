"use client";

import {
  CheckCircle2,
  Clipboard,
  LoaderCircle,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import {
  useEffect,
  useId,
  useState,
  type FormEvent,
} from "react";
import {
  DESKTOP_LINK_EMAIL_MAX_LENGTH,
  isValidDesktopLinkEmail,
} from "@/lib/contact/desktop-link-shared";

type SubmissionState =
  | { status: "idle"; heading: string; body: string }
  | { status: "success"; heading: string; body: string }
  | { status: "error"; heading: string; body: string };

type CopyState = "idle" | "copied" | "error";

const initialSubmissionState: SubmissionState = {
  status: "idle",
  heading: "",
  body: "",
};

function getCurrentUrl() {
  if (typeof window === "undefined") {
    return "/app";
  }

  return window.location.href;
}

function getDeviceRange() {
  if (typeof window === "undefined") {
    return "mobile";
  }

  return window.matchMedia("(max-width: 767px)").matches ? "mobile" : "tablet";
}

function getUrlMetadata(intendedUrl: string) {
  try {
    const url = new URL(intendedUrl);

    return {
      utmSource: url.searchParams.get("utm_source") || "",
      utmMedium: url.searchParams.get("utm_medium") || "",
      utmCampaign: url.searchParams.get("utm_campaign") || "",
    };
  } catch {
    return {
      utmSource: "",
      utmMedium: "",
      utmCampaign: "",
    };
  }
}

async function copyTextToClipboard(value: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.top = "-999px";
  textarea.style.left = "-999px";
  document.body.appendChild(textarea);
  textarea.select();

  const copied = document.execCommand("copy");
  document.body.removeChild(textarea);

  if (!copied) {
    throw new Error("Clipboard copy failed.");
  }
}

export function ResponsiveWorkspaceGate() {
  const emailInputId = useId();
  const emailErrorId = useId();
  const privacyCopyId = useId();
  const [email, setEmail] = useState("");
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [fieldError, setFieldError] = useState("");
  const [submissionState, setSubmissionState] = useState<SubmissionState>(
    initialSubmissionState,
  );
  const [copyState, setCopyState] = useState<CopyState>("idle");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (copyState === "idle") {
      return;
    }

    const resetTimer = window.setTimeout(() => {
      setCopyState("idle");
    }, 2600);

    return () => window.clearTimeout(resetTimer);
  }, [copyState]);

  async function handleCopyLink() {
    try {
      await copyTextToClipboard(getCurrentUrl());
      setCopyState("copied");
    } catch {
      setCopyState("error");
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedEmail = email.trim();

    if (!isValidDesktopLinkEmail(normalizedEmail)) {
      setFieldError("Enter a valid email address.");
      setSubmissionState(initialSubmissionState);
      return;
    }

    setFieldError("");
    setSubmissionState(initialSubmissionState);
    setIsSubmitting(true);

    const intendedUrl = getCurrentUrl();
    const urlMetadata = getUrlMetadata(intendedUrl);

    try {
      const response = await fetch("/api/desktop-link", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: normalizedEmail,
          intendedUrl,
          deviceRange: getDeviceRange(),
          marketingOptIn,
          source: "workspace-gate",
          referrer: typeof document === "undefined" ? "" : document.referrer,
          ...urlMetadata,
        }),
      });

      if (!response.ok) {
        setSubmissionState({
          status: "error",
          heading: "Something went wrong",
          body: "Please try again, or copy the link instead.",
        });
        return;
      }

      setSubmissionState({
        status: "success",
        heading: "desktop link sent",
        body: "check your inbox. we sent you a link to open instalyzer on a desktop-sized screen.",
      });
    } catch {
      setSubmissionState({
        status: "error",
        heading: "Something went wrong",
        body: "Please try again, or copy the link instead.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const hasFieldError = Boolean(fieldError);

  return (
    <section
      className="responsive-workspace-gate"
      aria-labelledby="responsive-workspace-gate-title"
    >
      <div className="responsive-workspace-gate__shell">
        <div className="responsive-workspace-gate__main">
          <div className="responsive-workspace-gate__eyebrow-row">
            <p className="section-kicker responsive-workspace-gate__kicker">
              desktop workspace
            </p>
          </div>

          <div className="responsive-workspace-gate__copy">
            <h1 id="responsive-workspace-gate-title">
              <span className="responsive-workspace-gate__mobile-copy">
                Instalyzer works best on desktop
              </span>
              <span className="responsive-workspace-gate__tablet-copy">
                workspace available on desktop
              </span>
            </h1>

            <div className="responsive-workspace-gate__body">
              <p className="responsive-workspace-gate__mobile-copy">
                The Not Following Back tool uses your Instagram export in a
                detailed workspace, so it needs a wider screen.
              </p>
              <p className="responsive-workspace-gate__mobile-copy">
                Send yourself this link and open it later on your laptop or
                desktop.
              </p>
              <p className="responsive-workspace-gate__tablet-copy">
                send yourself the link and continue on desktop.
              </p>
            </div>
          </div>

          {submissionState.status === "success" ? (
            <div
              className="responsive-workspace-gate__state responsive-workspace-gate__state--success"
              role="status"
            >
              <CheckCircle2 size={20} aria-hidden="true" />
              <div>
                <h2>{submissionState.heading}</h2>
                <p>{submissionState.body}</p>
              </div>
            </div>
          ) : null}

          {submissionState.status === "error" ? (
            <div
              className="responsive-workspace-gate__state responsive-workspace-gate__state--error"
              role="alert"
            >
              <div>
                <h2>{submissionState.heading}</h2>
                <p>{submissionState.body}</p>
              </div>
              <button
                type="button"
                className="responsive-workspace-gate__state-copy"
                onClick={handleCopyLink}
              >
                Copy link
              </button>
            </div>
          ) : null}

          {submissionState.status !== "success" ? (
            <form className="responsive-workspace-gate__form" onSubmit={handleSubmit}>
              <label className="responsive-workspace-gate__field" htmlFor={emailInputId}>
                <span>Email address</span>
                <input
                  id={emailInputId}
                  type="email"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    if (fieldError) {
                      setFieldError("");
                    }
                  }}
                  placeholder="you@example.com"
                  autoComplete="email"
                  maxLength={DESKTOP_LINK_EMAIL_MAX_LENGTH}
                  aria-invalid={hasFieldError}
                  aria-describedby={hasFieldError ? emailErrorId : privacyCopyId}
                  disabled={isSubmitting}
                />
              </label>

              {hasFieldError ? (
                <p
                  id={emailErrorId}
                  className="responsive-workspace-gate__field-error"
                  role="alert"
                >
                  {fieldError}
                </p>
              ) : null}

              <button
                type="submit"
                className="hero-btn hero-btn-primary responsive-workspace-gate__submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    sending
                    <LoaderCircle
                      size={16}
                      aria-hidden="true"
                      className="contact-support-form__spinner"
                    />
                  </>
                ) : (
                  "Send me the desktop link"
                )}
              </button>

              <div className="responsive-workspace-gate__copy-link-row">
                <button
                  type="button"
                  className={`responsive-workspace-gate__copy-link${
                    copyState === "copied" ? " is-copied" : ""
                  }`}
                  onClick={handleCopyLink}
                >
                  {copyState === "copied" ? (
                    <CheckCircle2 size={15} aria-hidden="true" />
                  ) : (
                    <Clipboard size={15} aria-hidden="true" />
                  )}
                  copy desktop link
                </button>
                {copyState === "error" ? (
                  <span className="responsive-workspace-gate__copy-error" role="status">
                    copy failed
                  </span>
                ) : null}
              </div>

              <label className="responsive-workspace-gate__checkbox">
                <input
                  type="checkbox"
                  checked={marketingOptIn}
                  onChange={(event) => setMarketingOptIn(event.target.checked)}
                  disabled={isSubmitting}
                />
                <span>also send me occasional instalyzer updates</span>
              </label>

              <p id={privacyCopyId} className="responsive-workspace-gate__privacy-copy">
                <span className="responsive-workspace-gate__mobile-copy">
                  we&apos;ll use your email to send this link. product updates
                  are optional.
                </span>
                <span className="responsive-workspace-gate__tablet-copy">
                  we&apos;ll only use your email to send this link unless you opt
                  into updates.
                </span>
              </p>
            </form>
          ) : null}
        </div>

        <aside
          className="responsive-workspace-gate__guide"
          aria-labelledby="responsive-workspace-gate-guide-title"
        >
          <div>
            <h2 id="responsive-workspace-gate-guide-title">
              <span className="responsive-workspace-gate__mobile-copy">
                need help exporting your data?
              </span>
              <span className="responsive-workspace-gate__tablet-copy">
                learn how to export your data
              </span>
            </h2>
            <p>
              <span className="responsive-workspace-gate__mobile-copy">
                follow the guide to request and download your Instagram data
                before opening Instalyzer on desktop.
              </span>
              <span className="responsive-workspace-gate__tablet-copy">
                follow the guide to request and download your Instagram data
                before opening Instalyzer on desktop.
              </span>
            </p>
          </div>

          <Link href="/help" className="responsive-workspace-gate__guide-link">
            open export guide
          </Link>

          <p className="responsive-workspace-gate__landscape-note">
            Using a larger tablet? Try landscape mode.
          </p>
        </aside>

        <div className="responsive-workspace-gate__trust">
          <p>
            <ShieldCheck size={16} aria-hidden="true" />
            <span>No Instagram password required. You upload your own Instagram export.</span>
          </p>

          <nav aria-label="Workspace gate footer links">
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
            <Link href="/contact">Contact</Link>
          </nav>
        </div>
      </div>
    </section>
  );
}
