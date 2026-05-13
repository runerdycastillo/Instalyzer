"use client";

import { FirebaseError } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useId, useRef, useState } from "react";
import {
  getFirebaseClientAuth,
  getGoogleAuthProvider,
} from "@/lib/firebase/client";

type AuthFormMode = "sign-in" | "sign-up";

type AuthFormProps = {
  mode: AuthFormMode;
  variant?: "route" | "compact";
  showSwitch?: boolean;
};

function getFirebaseAuthMessage(error: unknown, mode: AuthFormMode) {
  if (!(error instanceof FirebaseError)) {
    return "we could not finish that request, please try again";
  }

  switch (error.code) {
    case "auth/email-already-in-use":
      return "that email already has an account, sign in instead";
    case "auth/invalid-credential":
    case "auth/user-not-found":
    case "auth/wrong-password":
      return "incorrect email or password";
    case "auth/invalid-email":
      return "enter a valid email address";
    case "auth/network-request-failed":
      return "check your connection and try again";
    case "auth/popup-blocked":
      return "allow the google sign-in popup and try again";
    case "auth/too-many-requests":
      return "too many attempts, try later";
    case "auth/unauthorized-domain":
      return "google sign-in is not ready for this address yet";
    case "auth/weak-password":
      return "use a stronger password with at least 6 characters";
    case "auth/operation-not-allowed":
      return mode === "sign-in"
        ? "this sign-in option is not available yet"
        : "this workspace setup option is not available yet";
    default:
      return "we could not finish that request, please try again";
  }
}

function isSilentAuthCancel(error: unknown) {
  return (
    error instanceof FirebaseError &&
    (error.code === "auth/popup-closed-by-user" ||
      error.code === "auth/cancelled-popup-request")
  );
}

function parsePopupFeatures(features: string | undefined) {
  const parsedFeatures = new Map<string, string>();

  features?.split(",").forEach((feature) => {
    const [rawKey, rawValue] = feature.split("=");
    const key = rawKey?.trim();

    if (key) {
      parsedFeatures.set(key, rawValue?.trim() || "yes");
    }
  });

  return parsedFeatures;
}

function getNumericPopupFeature(
  features: Map<string, string>,
  key: string,
  fallback: number,
) {
  const value = Number.parseInt(features.get(key) || "", 10);

  return Number.isFinite(value) ? value : fallback;
}

function centerPopupFeatures(features: string | undefined) {
  const parsedFeatures = parsePopupFeatures(features);
  const width = getNumericPopupFeature(parsedFeatures, "width", 500);
  const height = getNumericPopupFeature(parsedFeatures, "height", 600);
  const currentWindowWidth = window.outerWidth || window.innerWidth;
  const currentWindowHeight = window.outerHeight || window.innerHeight;
  const left = Math.round(window.screenX + (currentWindowWidth - width) / 2);
  const top = Math.round(window.screenY + (currentWindowHeight - height) / 2);

  parsedFeatures.set("left", left.toString());
  parsedFeatures.set("top", top.toString());

  return Array.from(parsedFeatures)
    .map(([key, value]) => `${key}=${value}`)
    .join(",");
}

function centerNextPopupOverCurrentWindow() {
  const openWindow = window.open;
  let restored = false;
  let popupWindow: Window | null = null;

  const restore = () => {
    if (!restored) {
      window.open = openWindow;
      restored = true;
    }
  };

  window.open = ((url, target, features) => {
    popupWindow = openWindow.call(window, url, target, centerPopupFeatures(features));
    window.setTimeout(restore, 0);

    return popupWindow;
  }) as typeof window.open;

  return {
    getPopup: () => popupWindow,
    restore,
  };
}

async function createServerSession(idToken: string) {
  const response = await fetch("/api/auth/session", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ idToken }),
  });

  if (!response.ok) {
    let message = "we could not prepare your workspace, please try again";

    try {
      const payload = (await response.json()) as { message?: string };
      message = payload.message || message;
    } catch {
      // Keep the fallback message if the response is not JSON.
    }

    throw new Error(message);
  }
}

export function AuthForm({ mode, variant = "route", showSwitch = true }: AuthFormProps) {
  const router = useRouter();
  const errorMessageId = useId();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [pendingAction, setPendingAction] = useState<"email" | "google" | null>(null);
  const [isGoogleShimmering, setIsGoogleShimmering] = useState(false);
  const googleAttemptRef = useRef(0);
  const googlePopupRef = useRef<Window | null>(null);
  const googleShimmerTimeoutRef = useRef<number | null>(null);
  const compact = variant === "compact";

  const isSignUp = mode === "sign-up";
  const title = isSignUp ? "create your private Instalyzer workspace" : "return to your workspace";
  const description = isSignUp
    ? "set up a secure workspace for your official instagram export and start turning it into a reusable private dataset."
    : "sign in to continue working with your private instagram export dataset.";
  const badgeLabel = isSignUp ? "private workspace" : "workspace access";
  const submitLabel = isSignUp ? "create account" : "sign in";
  const switchHref = isSignUp ? "/sign-in" : "/sign-up";
  const switchLabel = isSignUp ? "have an account?" : "new to Instalyzer?";
  const switchAction = isSignUp ? "sign in" : "create a workspace";
  const formTitle = isSignUp ? "start with email" : "sign in with email";
  const formDescription = isSignUp
    ? "choose email or google to create your workspace."
    : "choose email or google to reopen your workspace.";
  const summaryTitle = isSignUp ? "what you get" : "pick up where you left off";
  const googleLabel = compact
    ? isSignUp
      ? "sign up with google"
      : "sign in with google"
    : "continue with google";
  const normalizedEmail = email.trim();
  const summaryItems = isSignUp
    ? [
        {
          title: "a private place for your export",
          body: "keep your instagram data tied to your own account.",
        },
        {
          title: "a reusable dataset workspace",
          body: "organize your export once, then return to it whenever you need.",
        },
        {
          title: "built around official exports",
          body: "Instalyzer works with the data you request directly from instagram.",
        },
      ]
    : [
        {
          title: "your workspace",
          body: "return to your saved export workspace.",
        },
        {
          title: "your dataset",
          body: "continue from the same private dataset view.",
        },
        {
          title: "your account",
          body: "keep access connected to you.",
        },
      ];
  const isPending = pendingAction !== null;

  useEffect(() => {
    return () => {
      if (googleShimmerTimeoutRef.current !== null) {
        window.clearTimeout(googleShimmerTimeoutRef.current);
      }
    };
  }, []);

  const finishSignIn = async (idToken: string) => {
    await createServerSession(idToken);
    router.refresh();
    router.push("/account");
  };

  const handleEmailSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isPending) {
      return;
    }

    setErrorMessage("");

    if (isSignUp && password !== confirmPassword) {
      setErrorMessage("passwords do not match");
      return;
    }

    setPendingAction("email");

    try {
      const auth = getFirebaseClientAuth();
      const credential = isSignUp
        ? await createUserWithEmailAndPassword(auth, normalizedEmail, password)
        : await signInWithEmailAndPassword(auth, normalizedEmail, password);
      const idToken = await credential.user.getIdToken();

      await finishSignIn(idToken);
    } catch (error) {
      setErrorMessage(
        error instanceof FirebaseError
            ? getFirebaseAuthMessage(error, mode)
            : error instanceof Error
              ? error.message
            : "we could not finish that request, please try again",
      );
      setPendingAction(null);
    }
  };

  const handleGoogleSignIn = async () => {
    const existingPopup = googlePopupRef.current;

    if (existingPopup && !existingPopup.closed) {
      existingPopup.focus();
      return;
    }

    if (isPending) {
      return;
    }

    const clearGoogleShimmer = () => {
      if (googleShimmerTimeoutRef.current !== null) {
        window.clearTimeout(googleShimmerTimeoutRef.current);
        googleShimmerTimeoutRef.current = null;
      }

      setIsGoogleShimmering(false);
    };

    clearGoogleShimmer();
    setIsGoogleShimmering(true);
    googleShimmerTimeoutRef.current = window.setTimeout(() => {
      setIsGoogleShimmering(false);
      googleShimmerTimeoutRef.current = null;
    }, 520);

    const attemptId = googleAttemptRef.current + 1;
    googleAttemptRef.current = attemptId;

    const releaseCurrentGoogleAttempt = () => {
      if (googleAttemptRef.current === attemptId) {
        clearGoogleShimmer();
        setPendingAction(null);
      }
    };

    setErrorMessage("");
    setPendingAction("google");

    const centeredPopup = centerNextPopupOverCurrentWindow();
    let popupCloseTimer: number | null = null;

    try {
      const credentialPromise = signInWithPopup(getFirebaseClientAuth(), getGoogleAuthProvider());

      window.setTimeout(() => {
        const popup = centeredPopup.getPopup();

        if (!popup) {
          return;
        }

        googlePopupRef.current = popup;
        popupCloseTimer = window.setInterval(() => {
          if (popup.closed) {
            if (popupCloseTimer !== null) {
              window.clearInterval(popupCloseTimer);
              popupCloseTimer = null;
            }

            googlePopupRef.current = null;
            releaseCurrentGoogleAttempt();
          }
        }, 120);
      }, 0);

      const credential = await credentialPromise;
      const idToken = await credential.user.getIdToken();

      await finishSignIn(idToken);
    } catch (error) {
      if (!isSilentAuthCancel(error)) {
        setErrorMessage(getFirebaseAuthMessage(error, mode));
      }
    } finally {
      centeredPopup.restore();
      googlePopupRef.current = null;

      if (popupCloseTimer !== null) {
        window.clearInterval(popupCloseTimer);
      }

      releaseCurrentGoogleAttempt();
    }
  };

  const form = (
    <form
      className={`${compact ? "auth-panel auth-panel--compact" : "auth-panel"}${
        isPending ? " is-pending" : ""
      }`}
      onSubmit={handleEmailSubmit}
      aria-busy={isPending}
    >
      {!compact ? (
        <div className="auth-panel__head">
          <h2>{formTitle}</h2>
          <p>{formDescription}</p>
        </div>
      ) : null}

      <label className="dataset-field">
        <span>email</span>
        <input
          type="email"
          autoComplete="email"
          placeholder="email@example.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          aria-describedby={errorMessage ? errorMessageId : undefined}
          required
        />
      </label>

      <label className="dataset-field">
        <span>password</span>
        <div className="dataset-field__input-wrap">
          <input
            type={isPasswordVisible ? "text" : "password"}
            autoComplete={isSignUp ? "new-password" : "current-password"}
            placeholder="************"
            minLength={6}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            aria-describedby={errorMessage ? errorMessageId : undefined}
            required
          />
          <button
            type="button"
            className="dataset-field__password-toggle"
            aria-label={isPasswordVisible ? "hide password" : "show password"}
            aria-pressed={isPasswordVisible}
            title={isPasswordVisible ? "Hide password" : "Show password"}
            onClick={() => setIsPasswordVisible((value) => !value)}
          >
            {isPasswordVisible ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
          </button>
        </div>
      </label>

      {isSignUp ? (
        <label className="dataset-field">
          <span>confirm password</span>
          <div className="dataset-field__input-wrap">
            <input
              type={isConfirmPasswordVisible ? "text" : "password"}
              autoComplete="new-password"
              placeholder="************"
              minLength={6}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              aria-describedby={errorMessage ? errorMessageId : undefined}
              required
            />
            <button
              type="button"
              className="dataset-field__password-toggle"
              aria-label={isConfirmPasswordVisible ? "hide password" : "show password"}
              aria-pressed={isConfirmPasswordVisible}
              title={isConfirmPasswordVisible ? "Hide password" : "Show password"}
              onClick={() => setIsConfirmPasswordVisible((value) => !value)}
            >
              {isConfirmPasswordVisible ? (
                <EyeOff size={16} aria-hidden="true" />
              ) : (
                <Eye size={16} aria-hidden="true" />
              )}
            </button>
          </div>
        </label>
      ) : null}

      {errorMessage ? (
        <div className="auth-panel__feedback" aria-live="polite">
          <p id={errorMessageId} className="auth-panel__error" role="alert">
            {errorMessage}
          </p>
        </div>
      ) : null}

      <div className="auth-panel__actions">
        <button
          type="submit"
          className={`hero-btn hero-btn-primary${pendingAction === "email" ? " is-loading" : ""}`}
          disabled={isPending}
        >
          <span className="auth-panel__button-content">
            <span>{submitLabel}</span>
          </span>
        </button>
        <button
          type="button"
          className={`hero-btn hero-btn-secondary auth-panel__google${
            pendingAction === "google" ? " is-google-pending" : ""
          }${isGoogleShimmering ? " is-shimmering" : ""
          }`}
          onClick={handleGoogleSignIn}
          disabled={isPending}
        >
          <span className="auth-panel__button-content">
            <span className="auth-panel__google-icon" aria-hidden="true">
              <svg viewBox="0 0 18 18" focusable="false">
                <path
                  fill="#4285f4"
                  d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.91c1.7-1.57 2.69-3.88 2.69-6.62Z"
                />
                <path
                  fill="#34a853"
                  d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.91-2.26c-.8.54-1.84.86-3.05.86-2.35 0-4.34-1.58-5.05-3.72H.94v2.33A9 9 0 0 0 9 18Z"
                />
                <path
                  fill="#fbbc05"
                  d="M3.95 10.7A5.41 5.41 0 0 1 3.67 9c0-.59.1-1.16.28-1.7V4.97H.94A9 9 0 0 0 0 9c0 1.45.34 2.82.94 4.03l3.01-2.33Z"
                />
                <path
                  fill="#ea4335"
                  d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.58-2.58C13.46.9 11.43 0 9 0A9 9 0 0 0 .94 4.97L3.95 7.3C4.66 5.16 6.65 3.58 9 3.58Z"
                />
              </svg>
            </span>
            <span>{googleLabel}</span>
          </span>
        </button>
      </div>

      {showSwitch ? (
        <p className="auth-panel__switch">
          {switchLabel} <Link href={switchHref}>{switchAction}</Link>
        </p>
      ) : null}
    </form>
  );

  if (compact) {
    return form;
  }

  return (
    <section className="auth-route" aria-labelledby="auth-route-title">
      <div className="auth-route__intro">
        <span className="route-badge route-badge--marketing">{badgeLabel}</span>
        <h1 id="auth-route-title">{title}</h1>
        <p>{description}</p>
      </div>

      <div className="auth-route__shell">
        {form}

        <aside className="auth-summary" aria-label={summaryTitle}>
          <h2>{summaryTitle}</h2>
          <ul>
            {summaryItems.map((item) => (
              <li key={item.title}>
                <strong>{item.title}</strong>
                <span>{item.body}</span>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </section>
  );
}
