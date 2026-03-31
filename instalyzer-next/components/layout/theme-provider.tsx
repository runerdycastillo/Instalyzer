"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";

type ThemeMode = "light" | "dark";

type ThemeContextValue = {
  theme: ThemeMode;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyTheme(theme: ThemeMode) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.backgroundColor = theme === "dark" ? "#171b21" : "#f6f8fc";
  document.documentElement.style.colorScheme = theme;

  if (document.body) {
    document.body.style.backgroundColor = theme === "dark" ? "#171b21" : "#f6f8fc";
    document.body.style.color = theme === "dark" ? "#e7edf7" : "#1f2937";
  }
}

export function ThemeProvider({
  children,
}: {
  children: ReactNode;
}) {
  const theme: ThemeMode = "dark";

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      toggleTheme: () => {},
    }),
    [theme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }

  return context;
}
