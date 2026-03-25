import type { Metadata } from "next";
import { cookies } from "next/headers";
import { IBM_Plex_Mono, Source_Sans_3 } from "next/font/google";
import Script from "next/script";
import { ThemeProvider } from "@/components/layout/theme-provider";
import "./globals.css";

const sourceSans = Source_Sans_3({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Instalyzer",
  description: "Instagram dataset workspace migration foundation",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const savedTheme = cookieStore.get("ig_theme_v1")?.value;
  const initialTheme = savedTheme === "dark" ? "dark" : "light";
  const initialBg = initialTheme === "dark" ? "#171b21" : "#f6f8fc";
  const initialInk = initialTheme === "dark" ? "#e7edf7" : "#1f2937";

  return (
    <html
      lang="en"
      className={`${sourceSans.variable} ${plexMono.variable}`}
      data-theme={initialTheme}
      style={{ backgroundColor: initialBg, colorScheme: initialTheme }}
      suppressHydrationWarning
    >
      <head>
        <meta name="color-scheme" content={initialTheme === "dark" ? "dark" : "light"} />
      </head>
      <body style={{ backgroundColor: initialBg, color: initialInk }}>
        <Script id="instalyzer-theme-init" strategy="beforeInteractive">
          {`
            (function() {
              function applyTheme(theme) {
                document.documentElement.dataset.theme = theme;
                document.documentElement.style.backgroundColor =
                  theme === "dark" ? "#171b21" : "#f6f8fc";
                document.documentElement.style.colorScheme =
                  theme === "dark" ? "dark" : "light";

                if (document.body) {
                  document.body.style.backgroundColor =
                    theme === "dark" ? "#171b21" : "#f6f8fc";
                  document.body.style.color =
                    theme === "dark" ? "#e7edf7" : "#1f2937";
                }
              }

              try {
                var savedTheme = window.localStorage.getItem("ig_theme_v1");
                var theme = savedTheme === "dark" ? "dark" : "light";
                document.cookie = "ig_theme_v1=" + theme + "; path=/; max-age=31536000; samesite=lax";
                applyTheme(theme);
              } catch (error) {
                applyTheme("light");
              }
            })();
          `}
        </Script>
        <ThemeProvider initialTheme={initialTheme}>{children}</ThemeProvider>
      </body>
    </html>
  );
}
