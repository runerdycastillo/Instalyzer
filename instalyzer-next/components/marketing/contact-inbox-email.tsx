"use client";

import { Check, CircleAlert, Copy } from "lucide-react";
import { useEffect, useState } from "react";

const SUPPORT_EMAIL = "support@instalyzer.app";

export function ContactInboxEmail() {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");

  useEffect(() => {
    if (copyState === "idle") return undefined;

    const timeout = window.setTimeout(() => {
      setCopyState("idle");
    }, 1800);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [copyState]);

  async function handleCopyEmail() {
    try {
      await navigator.clipboard.writeText(SUPPORT_EMAIL);
      setCopyState("copied");
    } catch {
      setCopyState("error");
    }
  }

  const isCopied = copyState === "copied";
  const hasCopyError = copyState === "error";

  return (
    <button
      type="button"
      className={`marketing-info-page__aside-email-button${isCopied ? " is-copied" : ""}${
        hasCopyError ? " is-error" : ""
      }`}
      onClick={handleCopyEmail}
      aria-label={
        isCopied
          ? "support email copied to clipboard"
          : hasCopyError
            ? "copy failed"
            : "Copy support@instalyzer.app to clipboard"
      }
      title={isCopied ? "email copied" : hasCopyError ? "copy failed" : "copy email"}
    >
      <span className="marketing-info-page__aside-email">support@instalyzer.app</span>
      <span
        className="marketing-info-page__aside-email-icon"
        role={hasCopyError ? "alert" : undefined}
        aria-hidden={hasCopyError ? undefined : "true"}
      >
        {isCopied ? (
          <Check size={15} strokeWidth={2.1} />
        ) : hasCopyError ? (
          <CircleAlert size={15} strokeWidth={2.1} />
        ) : (
          <Copy size={15} strokeWidth={1.9} />
        )}
      </span>
    </button>
  );
}
