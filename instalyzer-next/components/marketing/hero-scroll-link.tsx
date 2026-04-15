"use client";

import type { MouseEvent, ReactNode } from "react";

type HeroScrollLinkProps = {
  targetId: string;
  centeredSelector?: string;
  className?: string;
  ariaLabel: string;
  children: ReactNode;
};

export function HeroScrollLink({
  targetId,
  centeredSelector,
  className,
  ariaLabel,
  children,
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
    const scrollTarget = centeredTarget ?? section;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    scrollTarget.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "center",
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
