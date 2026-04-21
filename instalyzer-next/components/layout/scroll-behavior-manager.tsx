"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

function clearHashAfterAnchorLanding(hash: string) {
  window.setTimeout(() => {
    if (window.location.hash.replace(/^#/, "") !== hash) {
      return;
    }

    const nextUrl = `${window.location.pathname}${window.location.search}`;
    window.history.replaceState(window.history.state, "", nextUrl);
  }, 0);
}

function scrollToCurrentHash() {
  const hash = window.location.hash.replace(/^#/, "");
  if (!hash) {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    return;
  }

  const target = document.getElementById(hash);
  if (!target) {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    return;
  }

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (hash === "faq-section") {
    const intro = target.querySelector<HTMLElement>(".section-intro");
    const accordion = target.querySelector<HTMLElement>(".faq-placeholder-list");
    const introTop = (intro?.getBoundingClientRect().top ?? target.getBoundingClientRect().top) + window.scrollY;
    const accordionBottom =
      (accordion?.getBoundingClientRect().bottom ?? target.getBoundingClientRect().bottom) + window.scrollY;
    const focusHeight = Math.max(accordionBottom - introTop, 0);
    const viewportHeight = window.innerHeight;
    const nextTop = Math.max(introTop - (viewportHeight - focusHeight) / 2, 0);

    window.scrollTo({
      top: nextTop,
      left: 0,
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
    clearHashAfterAnchorLanding(hash);
    return;
  }

  target.scrollIntoView({
    behavior: prefersReducedMotion ? "auto" : "smooth",
    block: "start",
  });
}

export function ScrollBehaviorManager() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    document.documentElement.dataset.smoothScroll = "true";

    return () => {
      delete document.documentElement.dataset.smoothScroll;
    };
  }, []);

  useEffect(() => {
    window.requestAnimationFrame(scrollToCurrentHash);
  }, [pathname, searchParams]);

  useEffect(() => {
    const handleHashChange = () => {
      window.requestAnimationFrame(scrollToCurrentHash);
    };

    window.addEventListener("hashchange", handleHashChange);

    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, []);

  return null;
}
