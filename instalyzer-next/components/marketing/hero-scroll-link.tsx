"use client";

import type { MouseEvent, ReactNode } from "react";

type HeroScrollLinkProps = {
  targetId: string;
  className?: string;
  ariaLabel: string;
  children: ReactNode;
  targetRatio?: number;
};

export function HeroScrollLink({
  targetId,
  className,
  ariaLabel,
  children,
  targetRatio = 0.5,
}: HeroScrollLinkProps) {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();

    const target = document.getElementById(targetId);
    if (!target) {
      return;
    }

    const headerHeight =
      document.querySelector<HTMLElement>(".marketing-header")?.offsetHeight ?? 0;
    const targetRect = target.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const centeredTop =
      window.scrollY +
      targetRect.top +
      targetRect.height * targetRatio -
      viewportHeight / 2 -
      headerHeight / 2;

    window.history.replaceState(null, "", `#${targetId}`);
    window.scrollTo({
      top: Math.max(0, centeredTop),
      behavior: "smooth",
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
