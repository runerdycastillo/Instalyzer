import type { Metadata } from "next";
import { IBM_Plex_Mono, Source_Sans_3 } from "next/font/google";
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
  const initialTheme = "dark" as const;
  const initialBg = "#171b21";
  const initialInk = "#e7edf7";

  return (
    <html
      lang="en"
      className={`${sourceSans.variable} ${plexMono.variable}`}
      data-theme={initialTheme}
      style={{ backgroundColor: initialBg, colorScheme: initialTheme }}
      suppressHydrationWarning
    >
      <head>
        <meta name="color-scheme" content="dark" />
      </head>
      <body style={{ backgroundColor: initialBg, color: initialInk }}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
