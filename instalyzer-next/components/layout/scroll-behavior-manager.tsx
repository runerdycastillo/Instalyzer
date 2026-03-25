"use client";

import { useEffect } from "react";

export function ScrollBehaviorManager() {
  useEffect(() => {
    document.documentElement.dataset.smoothScroll = "true";

    return () => {
      delete document.documentElement.dataset.smoothScroll;
    };
  }, []);

  return null;
}
