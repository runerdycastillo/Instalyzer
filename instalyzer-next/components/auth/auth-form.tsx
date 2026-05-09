"use client";

import { FirebaseError } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import {
  getFirebaseClientAuth,
  getGoogleAuthProvider,
} from "@/lib/firebase/client";

type AuthFormMode = "sign-in" | "sign-up";

type AuthFormProps = {
  mode: AuthFormMode;
};

function getFirebaseAuthMessage(error: unknown, mode: AuthFormMode) {
  if (!(error instanceof FirebaseError)) {
    return "we could not finish that request. please try again.";
  }

  switch (error.code) {
    case "auth/email-already-in-use":
      return "that email already has an account. sign in instead.";
    case "auth/invalid-credential":
    case "auth/user-not-found":
    case "auth/wrong-password":
      return "that email or password did not match an account.";
    case "auth/invalid-email":
      return "enter a valid email address.";
    case "auth/popup-closed-by-user":
      return "google sign-in was closed before it finished.";
    case "auth/unauthorized-domain":
      return "this domain is not authorized for google sign-in yet.";
    case "auth/weak-password":
      return "use a stronger password with at least 6 characters.";
    case "auth/operation-not-allowed":
      return mode === "sign-in"
        ? "this sign-in method is not enabled yet."
        : "this sign-up method is not enabled yet.";
    default:
      return "we could not finish that request. please try again.";
  }
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
    let message = "we could not create your secure session.";

    try {
      const payload = (await response.json()) as { message?: string };
      message = payload.message || message;
    } catch {
      // Keep the fallback message if the response is not JSON.
    }

    throw new Error(message);
  }
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [pendingAction, setPendingAction] = useState<"email" | "google" | null>(null);

  const isSignUp = mode === "sign-up";
  const title = isSignUp ? "create your account" : "sign in to instalyzer";
  const description = isSignUp
    ? "save workspace access under your own account before cloud dataset ownership turns on."
    : "return to your workspace with a secure account session.";
  const submitLabel = isSignUp ? "create account" : "sign in";
  const switchHref = isSignUp ? "/sign-in" : "/sign-up";
  const switchLabel = isSignUp ? "already have an account?" : "need an account?";
  const switchAction = isSignUp ? "sign in" : "create one";
  const isPending = pendingAction !== null;

  const finishSignIn = async (idToken: string) => {
    await createServerSession(idToken);
    router.refresh();
    router.push("/account");
  };

  const handleEmailSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    setPendingAction("email");

    try {
      const auth = getFirebaseClientAuth();
      const credential = isSignUp
        ? await createUserWithEmailAndPassword(auth, email.trim(), password)
        : await signInWithEmailAndPassword(auth, email.trim(), password);
      const idToken = await credential.user.getIdToken();

      await finishSignIn(idToken);
    } catch (error) {
      setErrorMessage(
        error instanceof FirebaseError
          ? getFirebaseAuthMessage(error, mode)
          : error instanceof Error
            ? error.message
            : "we could not finish that request. please try again.",
      );
      setPendingAction(null);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMessage("");
    setPendingAction("google");

    try {
      const credential = await signInWithPopup(getFirebaseClientAuth(), getGoogleAuthProvider());
      const idToken = await credential.user.getIdToken();

      await finishSignIn(idToken);
    } catch (error) {
      setErrorMessage(getFirebaseAuthMessage(error, mode));
      setPendingAction(null);
    }
  };

  return (
    <section className="auth-route" aria-labelledby="auth-route-title">
      <div className="auth-route__intro">
        <span className="route-badge route-badge--marketing">account</span>
        <h1 id="auth-route-title">{title}</h1>
        <p>{description}</p>
      </div>

      <div className="auth-route__shell">
        <form className="auth-panel" onSubmit={handleEmailSubmit}>
          <div className="auth-panel__head">
            <h2>{isSignUp ? "start with email" : "use email"}</h2>
            <p>email/password and google sign-in are enabled for this first account pass.</p>
          </div>

          <label className="dataset-field">
            <span>email</span>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>

          <label className="dataset-field">
            <span>password</span>
            <input
              type="password"
              autoComplete={isSignUp ? "new-password" : "current-password"}
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>

          {errorMessage ? (
            <p className="dataset-field__error" role="alert">
              {errorMessage}
            </p>
          ) : null}

          <div className="auth-panel__actions">
            <button type="submit" className="hero-btn hero-btn-primary" disabled={isPending}>
              {pendingAction === "email" ? "working..." : submitLabel}
            </button>
            <button
              type="button"
              className="hero-btn hero-btn-secondary auth-panel__google"
              onClick={handleGoogleSignIn}
              disabled={isPending}
            >
              {pendingAction === "google" ? "opening google..." : "continue with google"}
            </button>
          </div>

          <p className="auth-panel__switch">
            {switchLabel} <Link href={switchHref}>{switchAction}</Link>
          </p>
        </form>

        <aside className="auth-summary" aria-label="Account setup notes">
          <h2>first account slice</h2>
          <ul>
            <li>firebase handles identity</li>
            <li>instalyzer stores a secure server session</li>
            <li>dataset ownership connects after this loop is verified</li>
          </ul>
        </aside>
      </div>
    </section>
  );
}
