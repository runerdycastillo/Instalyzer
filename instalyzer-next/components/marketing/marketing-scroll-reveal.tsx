"use client";

import { useEffect } from "react";

export function MarketingScrollReveal() {
  useEffect(() => {
    const revealItems = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    if (!revealItems.length) {
      return;
    }

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const navigationEntry = performance.getEntriesByType("navigation")[0];
    const navigationType =
      navigationEntry && "type" in navigationEntry
        ? (navigationEntry as PerformanceNavigationTiming).type
        : "navigate";
    const shouldRevealImmediately =
      (navigationType === "reload" || navigationType === "back_forward") && window.scrollY > 24;

    if (prefersReducedMotion || !("IntersectionObserver" in window) || shouldRevealImmediately) {
      revealItems.forEach((item) => item.classList.add("is-visible"));
    } else {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) {
              return;
            }

            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          });
        },
        {
          threshold: 0.16,
          rootMargin: "0px 0px -8% 0px",
        }
      );

      revealItems.forEach((item) => observer.observe(item));

      const resultsSection = document.querySelector<HTMLElement>(".results-preview-section");
      const valueNodes = Array.from(
        document.querySelectorAll<HTMLElement>(".results-preview-section [data-countup-target]")
      );

      if (!resultsSection || !valueNodes.length) {
        return () => observer.disconnect();
      }

      const animateValue = (node: HTMLElement, target: number, duration = 800) => {
        const start = performance.now();
        const safeTarget = Math.max(0, target);

        const step = (timestamp: number) => {
          const elapsed = timestamp - start;
          const progress = Math.min(elapsed / duration, 1);
          const eased = 1 - (1 - progress) ** 3;
          const nextValue = Math.round(safeTarget * eased);

          node.textContent = nextValue.toLocaleString();

          if (progress < 1) {
            window.requestAnimationFrame(step);
          } else {
            node.textContent = safeTarget.toLocaleString();
          }
        };

        window.requestAnimationFrame(step);
      };

      const resultsObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) {
              return;
            }

            valueNodes.forEach((node, index) => {
              const target = Number(node.dataset.countupTarget || 0);
              if (!Number.isFinite(target)) {
                return;
              }

              window.setTimeout(() => animateValue(node, target), index * 60);
            });

            resultsObserver.disconnect();
          });
        },
        {
          threshold: 0.3,
        }
      );

      resultsObserver.observe(resultsSection);

      return () => {
        observer.disconnect();
        resultsObserver.disconnect();
      };
    }

    const resultsSection = document.querySelector<HTMLElement>(".results-preview-section");
    const valueNodes = Array.from(
      document.querySelectorAll<HTMLElement>(".results-preview-section [data-countup-target]")
    );

    if (resultsSection && valueNodes.length) {
      valueNodes.forEach((node) => {
        const target = Number(node.dataset.countupTarget || 0);
        node.textContent = Number.isFinite(target) ? target.toLocaleString() : "0";
      });
    }
  }, []);

  return null;
}
