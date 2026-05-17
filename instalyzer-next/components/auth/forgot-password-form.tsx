"use client";

import { FirebaseError } from "firebase/app";
import { sendPasswordResetEmail } from "firebase/auth";
import { LoaderCircle, MailCheck } from "lucide-react";
import Link from "next/link";
import { type FormEvent, useEffect, useId, useState } from "react";
import { getFirebaseClientAuth } from "@/lib/firebase/client";

function getInitialEmail() {
  if (typeof window === "undefined") {
    return "";
  }

  return new URLSearchParams(window.location.search).get("email")?.trim() || "";
}

function getPasswordResetMessage(error: unknown) {
  if (!(error instanceof FirebaseError)) {
    return "we could not send that reset link, please try again";
  }

  switch (error.code) {
    case "auth/invalid-email":
      return "enter a valid email address";
    case "auth/network-request-failed":
      return "connection failed";
    case "auth/too-many-requests":
      return "too many attempts, try later";
    case "auth/user-not-found":
      return "";
    default:
      return "we could not send that reset link, please try again";
  }
}

export function ForgotPasswordForm() {
  const feedbackId = useId();
  const [email, setEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSentReset, setHasSentReset] = useState(false);

  useEffect(() => {
    setEmail(getInitialEmail());
  }, []);

  const normalizedEmail = email.trim();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setErrorMessage("");
    setHasSentReset(false);

    if (!normalizedEmail) {
      setErrorMessage("enter your email address");
      return;
    }

    setIsSubmitting(true);

    try {
      await sendPasswordResetEmail(getFirebaseClientAuth(), normalizedEmail);
      setHasSentReset(true);
    } catch (error) {
      const nextMessage = getPasswordResetMessage(error);

      if (nextMessage) {
        setErrorMessage(nextMessage);
      } else {
        setHasSentReset(true);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      className={`auth-panel auth-panel--compact forgot-password-form${
        isSubmitting ? " is-pending" : ""
      }`}
      onSubmit={handleSubmit}
      aria-busy={isSubmitting}
    >
      <label className="dataset-field">
        <span>email</span>
        <input
          type="email"
          autoComplete="email"
          placeholder="email@example.com"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);

            if (errorMessage) {
              setErrorMessage("");
            }
          }}
          aria-describedby={errorMessage ? feedbackId : undefined}
          disabled={isSubmitting || hasSentReset}
          required
        />
      </label>

      {errorMessage ? (
        <div className="auth-panel__feedback" aria-live="polite">
          <p id={feedbackId} className="auth-panel__error" role="alert">
            {errorMessage}
          </p>
        </div>
      ) : null}

      <div className="auth-panel__actions">
        <button
          type="submit"
          className={`hero-btn hero-btn-primary${isSubmitting ? " is-loading" : ""}${
            hasSentReset ? " is-success" : ""
          }`}
          disabled={isSubmitting || hasSentReset}
        >
          <span className="auth-panel__button-content" aria-live="polite">
            {hasSentReset ? (
              <>
                <span>email sent</span>
                <MailCheck size={16} strokeWidth={2} aria-hidden="true" />
              </>
            ) : (
              <>
                <span>send reset link</span>
                {isSubmitting ? <LoaderCircle size={16} aria-hidden="true" /> : null}
              </>
            )}
          </span>
        </button>
      </div>

      <p className="auth-panel__switch forgot-password-form__switch">
        know your password? <Link href="/sign-in">sign in</Link>
      </p>
    </form>
  );
}
