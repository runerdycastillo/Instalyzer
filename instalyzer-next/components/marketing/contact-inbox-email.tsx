"use client";

import { Check, Copy } from "lucide-react";
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

  return (
    <button
      type="button"
      className={`marketing-info-page__aside-email-button${isCopied ? " is-copied" : ""}`}
      onClick={handleCopyEmail}
      aria-label={
        isCopied ? "support email copied to clipboard" : "Copy support@instalyzer.app to clipboard"
      }
      title={isCopied ? "email copied" : "copy email"}
    >
      <span className="marketing-info-page__aside-email">support@instalyzer.app</span>
      <span className="marketing-info-page__aside-email-icon" aria-hidden="true">
        {isCopied ? <Check size={15} strokeWidth={2.1} /> : <Copy size={15} strokeWidth={1.9} />}
      </span>
    </button>
    
  );
}
