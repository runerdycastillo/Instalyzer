"use client";

import { useEffect } from "react";

export function MarketingScrollReveal() {
  useEffect(() => {
    const revealItems = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    if (!revealItems.length) {
      return;
    }

    document.documentElement.dataset.revealReady = "true";

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

      let revealFrameId = 0;
      const revealVisibleItems = () => {
        const viewportHeight = window.innerHeight || document.documentElement.clientHeight;

        revealItems.forEach((item) => {
          if (item.classList.contains("is-visible")) {
            return;
          }

          const rect = item.getBoundingClientRect();
          const isInRevealRange = rect.top <= viewportHeight * 0.92 && rect.bottom >= viewportHeight * 0.08;

          if (isInRevealRange) {
            item.classList.add("is-visible");
            observer.unobserve(item);
          }
        });
      };
      const scheduleRevealVisibleItems = () => {
        if (revealFrameId) {
          return;
        }

        revealFrameId = window.requestAnimationFrame(() => {
          revealFrameId = 0;
          revealVisibleItems();
        });
      };

      scheduleRevealVisibleItems();
      window.addEventListener("scroll", scheduleRevealVisibleItems, { passive: true });
      window.addEventListener("resize", scheduleRevealVisibleItems);

      const resultsSection = document.querySelector<HTMLElement>(".results-preview-section");
      const valueNodes = Array.from(
        document.querySelectorAll<HTMLElement>(".results-preview-section [data-countup-target]")
      );

      if (!resultsSection || !valueNodes.length) {
        return () => {
          observer.disconnect();
          delete document.documentElement.dataset.revealReady;
          window.removeEventListener("scroll", scheduleRevealVisibleItems);
          window.removeEventListener("resize", scheduleRevealVisibleItems);
          if (revealFrameId) {
            window.cancelAnimationFrame(revealFrameId);
          }
        };
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
        delete document.documentElement.dataset.revealReady;
        window.removeEventListener("scroll", scheduleRevealVisibleItems);
        window.removeEventListener("resize", scheduleRevealVisibleItems);
        if (revealFrameId) {
          window.cancelAnimationFrame(revealFrameId);
        }
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

    return () => {
      delete document.documentElement.dataset.revealReady;
    };
  }, []);

  return null;
}
