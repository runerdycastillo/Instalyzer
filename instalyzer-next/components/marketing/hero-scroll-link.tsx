"use client";

import type { MouseEvent, ReactNode } from "react";

type HeroScrollLinkProps = {
  targetId: string;
  centeredSelector?: string;
  shortHeightBottomSelector?: string;
  className?: string;
  ariaLabel: string;
  children: ReactNode;
  scrollBlock?: ScrollLogicalPosition;
};

export function HeroScrollLink({
  targetId,
  centeredSelector,
  shortHeightBottomSelector,
  className,
  ariaLabel,
  children,
  scrollBlock = "center",
}: HeroScrollLinkProps) {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();

    const section = document.getElementById(targetId);
    if (!section) {
      return;
    }

    const centeredTarget = centeredSelector
      ? section.querySelector<HTMLElement>(centeredSelector)
      : null;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const useShortHeightDesktopScroll = window.innerWidth >= 1024 && window.innerHeight <= 760;

    if (useShortHeightDesktopScroll) {
      const header = document.querySelector(".marketing-header");
      const bottomTarget =
        (shortHeightBottomSelector
          ? section.querySelector<HTMLElement>(shortHeightBottomSelector)
          : null) ?? section.querySelector<HTMLElement>(".tier-columns-meta");
      const headerHeight = header instanceof HTMLElement ? header.offsetHeight : 0;
      const topTarget = centeredTarget ?? section;
      const targetRect = topTarget.getBoundingClientRect();
      const targetBottomRect = bottomTarget?.getBoundingClientRect() ?? targetRect;
      const targetTop = targetRect.top + window.scrollY;
      const targetBottom = targetBottomRect.bottom + window.scrollY;
      const targetHeight = targetBottom - targetTop;
      const availableHeight = window.innerHeight - headerHeight;
      const centerOffset = Math.max(18, (availableHeight - targetHeight) / 2);
      const top = Math.max(0, targetTop - headerHeight - centerOffset);

      window.scrollTo({
        top,
        behavior: prefersReducedMotion ? "auto" : "smooth",
      });
      return;
    }

    const scrollTarget = centeredTarget ?? section;

    scrollTarget.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: scrollBlock,
    });
  };

  return (
    <a
      href={`#${targetId}`}
      className={className}
      aria-label={ariaLabel}
      onClick={handleClick}
    >
      {children}
    </a>
  );
}
