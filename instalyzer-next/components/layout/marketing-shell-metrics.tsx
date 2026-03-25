"use client";

import { useEffect } from "react";

export function MarketingShellMetrics() {
  useEffect(() => {
    const header = document.querySelector(".marketing-header");

    if (!(header instanceof HTMLElement)) {
      return;
    }

    const root = document.documentElement;

    const syncLayoutMetrics = () => {
      const headerHeight = header.offsetHeight;
      const heroHeight = Math.max(window.innerHeight - headerHeight - 22, 0);

      root.style.setProperty("--marketing-header-height", `${headerHeight}px`);
      root.style.setProperty("--marketing-hero-height", `${heroHeight}px`);
    };

    syncLayoutMetrics();

    const resizeObserver = new ResizeObserver(() => {
      syncLayoutMetrics();
    });

    resizeObserver.observe(header);

    window.addEventListener("resize", syncLayoutMetrics);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", syncLayoutMetrics);
    };
  }, []);

  return null;
}
