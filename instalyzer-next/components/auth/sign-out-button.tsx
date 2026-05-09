"use client";

import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { getFirebaseClientAuth } from "@/lib/firebase/client";

export function SignOutButton() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  const handleSignOut = async () => {
    setIsPending(true);

    try {
      await signOut(getFirebaseClientAuth());
      await fetch("/api/auth/sign-out", {
        method: "POST",
      });
      router.refresh();
      router.push("/sign-in");
    } catch {
      setIsPending(false);
    }
  };

  return (
    <button
      type="button"
      className="hero-btn hero-btn-secondary account-route__sign-out"
      onClick={handleSignOut}
      disabled={isPending}
    >
      {isPending ? "signing out..." : "sign out"}
    </button>
  );
}
