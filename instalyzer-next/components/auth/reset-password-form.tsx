"use client";

import { FirebaseError } from "firebase/app";
import {
  confirmPasswordReset,
  verifyPasswordResetCode,
} from "firebase/auth";
import { CheckCircle2, Eye, EyeOff, LoaderCircle } from "lucide-react";
import Link from "next/link";
import { type FormEvent, useEffect, useId, useMemo, useState } from "react";
import { getFirebaseClientAuth } from "@/lib/firebase/client";

type ResetLinkState =
  | { status: "checking" }
  | { status: "ready"; email: string }
  | { status: "invalid"; message: string }
  | { status: "success" };

function getResetCode() {
  if (typeof window === "undefined") {
    return "";
  }

  const searchParams = new URLSearchParams(window.location.search);
  const mode = searchParams.get("mode");

  if (mode && mode !== "resetPassword") {
    return "";
  }

  return searchParams.get("oobCode")?.trim() || "";
}

function getResetPasswordMessage(error: unknown) {
  if (!(error instanceof FirebaseError)) {
    return "we could not update your password, please try again";
  }

  switch (error.code) {
    case "auth/expired-action-code":
    case "auth/invalid-action-code":
    case "auth/user-disabled":
    case "auth/user-not-found":
      return "reset link expired. request a new one.";
    case "auth/weak-password":
      return "use a stronger password with at least 6 characters";
    case "auth/network-request-failed":
      return "connection failed";
    case "auth/too-many-requests":
      return "too many attempts, try later";
    default:
      return "we could not update your password, please try again";
  }
}

export function ResetPasswordForm() {
  const feedbackId = useId();
  const [resetCode, setResetCode] = useState("");
  const [linkState, setLinkState] = useState<ResetLinkState>({ status: "checking" });
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const nextCode = getResetCode();
    setResetCode(nextCode);

    if (!nextCode) {
      setLinkState({
        status: "invalid",
        message: "reset link expired. request a new one.",
      });
      return;
    }

    let isMounted = true;

    verifyPasswordResetCode(getFirebaseClientAuth(), nextCode)
      .then((email) => {
        if (isMounted) {
          setLinkState({ status: "ready", email });
        }
      })
      .catch((error) => {
        if (isMounted) {
          setLinkState({
            status: "invalid",
            message: getResetPasswordMessage(error),
          });
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const isChecking = linkState.status === "checking";
  const isReady = linkState.status === "ready";
  const isSuccess = linkState.status === "success";
  const isLocked = isChecking || isSubmitting || isSuccess || !isReady;
  const feedbackMessage = useMemo(() => {
    if (errorMessage) return errorMessage;
    if (linkState.status === "invalid") return linkState.message;
    return "";
  }, [errorMessage, linkState]);

  if (isChecking) {
    return (
      <div
        className="auth-panel auth-panel--compact reset-password-form reset-password-form--loading"
        aria-busy="true"
        aria-label="loading reset password form"
      >
        <div className="sign-up-loading__form" aria-hidden="true">
          {["new password", "confirm password"].map((field) => (
            <div className="sign-up-loading__field" key={field}>
              <span className="dataset-skeleton-line sign-up-loading__label" />
              <span className="dataset-skeleton-line sign-up-loading__input" />
            </div>
          ))}
          <span className="dataset-skeleton-line sign-up-loading__button" />
        </div>

        <p className="auth-panel__switch reset-password-form__switch">
          remember your password? <Link href="/sign-in">sign in</Link>
        </p>
      </div>
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isLocked || !resetCode) {
      return;
    }

    setErrorMessage("");

    if (password !== confirmPassword) {
      setErrorMessage("passwords do not match");
      return;
    }

    setIsSubmitting(true);

    try {
      await confirmPasswordReset(getFirebaseClientAuth(), resetCode, password);
      setPassword("");
      setConfirmPassword("");
      setLinkState({ status: "success" });
    } catch (error) {
      setErrorMessage(getResetPasswordMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      className={`auth-panel auth-panel--compact reset-password-form${
        isSubmitting ? " is-pending" : ""
      }`}
      onSubmit={handleSubmit}
      aria-busy={isSubmitting}
    >
      <label className="dataset-field">
        <span>new password</span>
        <div className="dataset-field__input-wrap">
          <input
            type={isPasswordVisible ? "text" : "password"}
            autoComplete="new-password"
            placeholder="************"
            minLength={6}
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);

              if (errorMessage) {
                setErrorMessage("");
              }
            }}
            aria-describedby={feedbackMessage ? feedbackId : undefined}
            disabled={isLocked}
            required
          />
          <button
            type="button"
            className="dataset-field__password-toggle"
            aria-label={isPasswordVisible ? "hide password" : "show password"}
            aria-pressed={isPasswordVisible}
            title={isPasswordVisible ? "Hide password" : "Show password"}
            onClick={() => setIsPasswordVisible((value) => !value)}
            disabled={isLocked}
          >
            {isPasswordVisible ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
          </button>
        </div>
      </label>

      <label className="dataset-field">
        <span>confirm password</span>
        <div className="dataset-field__input-wrap">
          <input
            type={isConfirmPasswordVisible ? "text" : "password"}
            autoComplete="new-password"
            placeholder="************"
            minLength={6}
            value={confirmPassword}
            onChange={(event) => {
              setConfirmPassword(event.target.value);

              if (errorMessage) {
                setErrorMessage("");
              }
            }}
            aria-describedby={feedbackMessage ? feedbackId : undefined}
            disabled={isLocked}
            required
          />
          <button
            type="button"
            className="dataset-field__password-toggle"
            aria-label={isConfirmPasswordVisible ? "hide password" : "show password"}
            aria-pressed={isConfirmPasswordVisible}
            title={isConfirmPasswordVisible ? "Hide password" : "Show password"}
            onClick={() => setIsConfirmPasswordVisible((value) => !value)}
            disabled={isLocked}
          >
            {isConfirmPasswordVisible ? (
              <EyeOff size={16} aria-hidden="true" />
            ) : (
              <Eye size={16} aria-hidden="true" />
            )}
          </button>
        </div>
      </label>

      {feedbackMessage ? (
        <div className="auth-panel__feedback" aria-live="polite">
          <p id={feedbackId} className="auth-panel__error" role="alert">
            {feedbackMessage}
          </p>
        </div>
      ) : null}

      <div className="auth-panel__actions">
        <button
          type="submit"
          className={`hero-btn hero-btn-primary${isSubmitting || isChecking ? " is-loading" : ""}${
            isSuccess ? " is-success" : ""
          }`}
          disabled={isLocked}
        >
          <span className="auth-panel__button-content" aria-live="polite">
            {isSuccess ? (
              <>
                <span>password updated</span>
                <CheckCircle2 size={16} strokeWidth={2} aria-hidden="true" />
              </>
            ) : isSubmitting ? (
              <>
                <span>updating password</span>
                <LoaderCircle size={16} aria-hidden="true" />
              </>
            ) : (
              <span>update password</span>
            )}
          </span>
        </button>
      </div>

      <p className="auth-panel__switch reset-password-form__switch">
        {linkState.status === "invalid" ? (
          <>
            need a new link? <Link href="/forgot-password">send one</Link>
          </>
        ) : isSuccess ? (
          <>
            ready to return? <Link href="/sign-in">sign in</Link>
          </>
        ) : (
          <>
            remember your password? <Link href="/sign-in">sign in</Link>
          </>
        )}
      </p>
    </form>
  );
}
