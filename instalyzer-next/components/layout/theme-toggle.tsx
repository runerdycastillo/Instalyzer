"use client";

import { MoonStar, SunMedium } from "lucide-react";
import { useTheme } from "@/components/layout/theme-provider";

export function ThemeToggle() {
  const { toggleTheme } = useTheme();

  return (
    <button
      type="button"
      className="top-nav-icon top-nav-theme-btn"
      aria-label="Toggle theme"
      title="Toggle theme"
      onClick={toggleTheme}
      data-theme-toggle
    >
      <SunMedium aria-hidden="true" className="theme-icon theme-icon--sun" strokeWidth={1.9} />
      <MoonStar aria-hidden="true" className="theme-icon theme-icon--moon" strokeWidth={1.9} />
    </button>
  );
}
