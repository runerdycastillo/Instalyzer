"use client";

import { signOut } from "firebase/auth";
import { CircleAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { getFirebaseClientAuth } from "@/lib/firebase/client";

export function SignOutButton() {
  const router = useRouter();
  const errorMessageId = useId();
  const [isPending, setIsPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSignOut = async () => {
    if (isPending) {
      return;
    }

    setIsPending(true);
    setErrorMessage("");

    try {
      await signOut(getFirebaseClientAuth());
      const response = await fetch("/api/auth/sign-out", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("sign-out route failed");
      }

      router.refresh();
      router.push("/sign-in");
    } catch {
      setErrorMessage("sign out failed, try again");
      setIsPending(false);
    }
  };

  return (
    <>
      <button
        type="button"
        className="hero-btn hero-btn-secondary account-route__sign-out"
        onClick={handleSignOut}
        disabled={isPending}
        aria-describedby={errorMessage ? errorMessageId : undefined}
      >
        {isPending ? "signing out..." : "sign out"}
      </button>
      {errorMessage ? (
        <span id={errorMessageId} className="account-route__sign-out-error" role="alert">
          <CircleAlert size={14} strokeWidth={2.1} aria-hidden="true" />
          <span>{errorMessage}</span>
        </span>
      ) : null}
    </>
  );
}
